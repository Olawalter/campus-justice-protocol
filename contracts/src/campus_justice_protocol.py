# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


VALID_CASE_TYPES = [
    "ACADEMIC_APPEAL",
    "EXAM_MISCONDUCT",
    "STUDENT_COMPLAINT",
    "ELECTION_DISPUTE",
    "SCHOLARSHIP",
    "HOSTEL",
    "RESEARCH_FUNDING",
]

# Statuses: SUBMITTED → RESPONDED? → DELIBERATING → DECIDED → APPEALED → FINAL
TERMINAL_STATUSES = ("DECIDED", "FINAL")


class CampusJusticeProtocol(gl.Contract):
    cases: TreeMap[str, str]        # case_id → JSON string
    case_ids: DynArray[str]         # ordered list for iteration
    cases_by_filer: TreeMap[str, str]  # address → JSON array of case_ids
    case_counter: u256

    def __init__(self) -> None:
        self.case_counter = u256(0)

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _caller(self) -> str:
        return str(gl.message.sender_address)

    def _next_case_id(self) -> str:
        self.case_counter = self.case_counter + u256(1)
        return f"CJP-{int(self.case_counter):06d}"

    def _get_case(self, case_id: str) -> dict:
        raw = self.cases.get(case_id, "")
        if not raw:
            raise Exception(f"Case not found: {case_id}")
        return json.loads(raw)

    def _save_case(self, case: dict) -> None:
        self.cases[case["case_id"]] = json.dumps(case)

    def _track_filer(self, filer: str, case_id: str) -> None:
        raw = self.cases_by_filer.get(filer, "[]")
        ids = json.loads(raw)
        ids.append(case_id)
        self.cases_by_filer[filer] = json.dumps(ids)

    def _precedent_context(self, case_type: str) -> str:
        summaries = []
        for pid in reversed(list(self.case_ids)):
            if len(summaries) >= 3:
                break
            raw = self.cases.get(pid, "")
            if not raw:
                continue
            c = json.loads(raw)
            if c.get("case_type") != case_type:
                continue
            j = c.get("judgment")
            if not j:
                continue
            summaries.append(
                f"[{pid}] Outcome: {j['outcome']} | Confidence: {j['confidence']} "
                f"| Summary: {j['reasoning'][:160]}"
            )
        return "\n".join(summaries) if summaries else "No prior precedents for this case type."

    def _fetch_url_evidence(self, refs: list) -> str:
        """Fetch URL-based evidence live. Called inside a nondet block."""
        parts = []
        for ref in refs:
            if ref.startswith("http://") or ref.startswith("https://"):
                try:
                    resp = gl.nondet.web.get(ref)
                    content = resp.body.decode("utf-8", errors="replace")[:3000]
                    parts.append(f"[LIVE URL EVIDENCE: {ref}]\n{content}")
                except Exception as e:
                    parts.append(f"[URL EVIDENCE — fetch failed: {ref}] ({str(e)[:80]})")
            else:
                parts.append(f"- {ref}")
        return "\n\n".join(parts) if parts else "None provided."

    def _run_judgment(self, case: dict, is_appeal: bool = False) -> dict:
        case_type = case["case_type"]
        title = case["title"]
        description = case["description"]
        response_text = case.get("response_text", "")
        evidence_refs = case.get("evidence_refs", [])
        appeal_grounds = (case.get("appeal") or {}).get("grounds", "")
        original_judgment = case.get("judgment") or {}
        precedents = self._precedent_context(case_type)

        if is_appeal:
            role = "Senior AI Arbitrator reviewing an appeal"
            context_block = (
                f"ORIGINAL JUDGMENT:\n"
                f"Outcome: {original_judgment.get('outcome', 'UNKNOWN')}\n"
                f"Confidence: {original_judgment.get('confidence', 0)}\n"
                f"Reasoning: {original_judgment.get('reasoning', '')}\n\n"
                f"APPEAL GROUNDS:\n{appeal_grounds}\n\n"
                "APPEAL REVIEW CRITERIA:\n"
                "1. Are the appeal grounds substantively valid?\n"
                "2. Was significant evidence overlooked in the original judgment?\n"
                "3. Does the original reasoning contain errors or gaps?\n"
                "4. Is the outcome consistent with precedents?\n\n"
            )
        else:
            role = "Impartial AI Arbitrator"
            context_block = (
                "EVALUATION CRITERIA:\n"
                "1. Is the complaint substantiated by the described evidence?\n"
                "2. Does the institution response (if any) address the core issue?\n"
                "3. What outcome is fair and proportionate?\n"
                "4. How does this compare to precedents?\n\n"
            )

        # Prompt template — evidence section injected dynamically inside nondet
        # so each validator fetches URL evidence independently (GenLayer web access)
        prompt_header = (
            f"You are a {role} for the Campus Justice Protocol — "
            "a decentralized AI arbitration system for university disputes.\n\n"
            f"CASE TYPE: {case_type.replace('_', ' ').title()}\n"
            f"TITLE: {title}\n\n"
            f"STUDENT COMPLAINT:\n{description}\n\n"
            f"INSTITUTION RESPONSE:\n{response_text if response_text else 'No response submitted.'}\n\n"
            f"EVIDENCE ({len(evidence_refs)} item(s) — URLs fetched live by each validator):\n"
        )

        prompt_footer = (
            f"\nSIMILAR PRECEDENTS:\n{precedents}\n\n"
            + context_block +
            "Respond ONLY with a JSON object — no markdown, no extra text:\n"
            '{\n'
            '  "outcome": "UPHELD" | "DISMISSED" | "PARTIAL" | "INCONCLUSIVE",\n'
            '  "reasoning": "Thorough analysis of at least 3 sentences citing specific facts.",\n'
            '  "key_findings": ["finding 1", "finding 2", "finding 3"],\n'
            '  "recommendation": "Specific actionable recommendation.",\n'
            '  "confidence": 0.85\n'
            '}\n\n'
            "Outcome meanings:\n"
            "- UPHELD: complaint is valid, institution should remedy\n"
            "- DISMISSED: institution position is correct, complaint lacks merit\n"
            "- PARTIAL: both parties have valid points\n"
            "- INCONCLUSIVE: insufficient evidence to decide"
        )

        def nondet() -> str:
            # Each validator independently fetches URL evidence from the live web
            evidence_block = self._fetch_url_evidence(evidence_refs)
            prompt = prompt_header + evidence_block + prompt_footer

            raw = gl.nondet.exec_prompt(prompt)
            cleaned = raw.strip()
            cleaned = cleaned.replace("```json", "").replace("```", "")
            start = cleaned.find("{")
            end = cleaned.rfind("}") + 1
            if start >= 0 and end > start:
                cleaned = cleaned[start:end]
            parsed = json.loads(cleaned.strip())
            outcome = str(parsed.get("outcome", "INCONCLUSIVE")).upper()
            if outcome not in ("UPHELD", "DISMISSED", "PARTIAL", "INCONCLUSIVE"):
                outcome = "INCONCLUSIVE"
            confidence = float(parsed.get("confidence", 0.5))
            confidence = round(max(0.0, min(1.0, confidence)), 4)
            return json.dumps({
                "outcome": outcome,
                "reasoning": str(parsed.get("reasoning", "")),
                "key_findings": list(parsed.get("key_findings", [])),
                "recommendation": str(parsed.get("recommendation", "")),
                "confidence": confidence,
            }, sort_keys=True)

        result_str = gl.eq_principle.prompt_non_comparative(
            nondet,
            task="Analyze a university dispute and return a JSON judgment with outcome, reasoning, key_findings, recommendation, and confidence.",
            criteria="Result must be a valid JSON object with keys: outcome (one of UPHELD/DISMISSED/PARTIAL/INCONCLUSIVE), reasoning (string), key_findings (list of strings), recommendation (string), confidence (float 0-1).",
        )
        return json.loads(result_str)

    # ── Write methods ──────────────────────────────────────────────────────────

    @gl.public.write
    def file_case(
        self,
        case_type: str,
        title: str,
        description: str,
        evidence_refs: str,
        matric_number: str,
        department: str,
        filed_at: str,
    ) -> str:
        if case_type not in VALID_CASE_TYPES:
            raise Exception(f"Invalid case type. Must be one of: {', '.join(VALID_CASE_TYPES)}")
        if len(title.strip()) < 5:
            raise Exception("Title must be at least 5 characters")
        if len(description.strip()) < 50:
            raise Exception("Description must be at least 50 characters")

        refs = json.loads(evidence_refs) if evidence_refs and evidence_refs.strip() else []
        if not isinstance(refs, list):
            refs = []
        if len(refs) > 10:
            raise Exception("Maximum 10 evidence references")

        case_id = self._next_case_id()
        caller = self._caller()
        case = {
            "case_id": case_id,
            "filer": caller,
            "case_type": case_type,
            "title": title.strip(),
            "description": description.strip(),
            "evidence_refs": refs,
            "matric_number": matric_number.strip(),
            "department": department.strip(),
            "status": "SUBMITTED",
            "response_text": "",
            "respondent": "",
            "judgment": None,
            "appeal": None,
            "final_judgment": None,
            "filed_at": filed_at if filed_at else str(int(self.case_counter)),
        }
        self._save_case(case)
        self.case_ids.append(case_id)
        self._track_filer(caller, case_id)
        return case_id

    @gl.public.write
    def submit_response(self, case_id: str, response_text: str) -> None:
        case = self._get_case(case_id)
        if case["status"] not in ("SUBMITTED",):
            raise Exception("Response can only be submitted when case is SUBMITTED")
        if len(response_text.strip()) < 30:
            raise Exception("Response must be at least 30 characters")
        case["response_text"] = response_text.strip()
        case["respondent"] = self._caller()
        case["status"] = "RESPONDED"
        self._save_case(case)

    @gl.public.write
    def request_judgment(self, case_id: str) -> None:
        case = self._get_case(case_id)
        if case["status"] not in ("SUBMITTED", "RESPONDED"):
            raise Exception("Judgment can only be requested when case is SUBMITTED or RESPONDED")

        case["status"] = "DELIBERATING"
        self._save_case(case)

        judgment = self._run_judgment(case, is_appeal=False)
        case["judgment"] = judgment
        case["status"] = "DECIDED"
        self._save_case(case)

    @gl.public.write
    def file_appeal(self, case_id: str, grounds: str) -> None:
        case = self._get_case(case_id)
        caller = self._caller()
        if case["status"] != "DECIDED":
            raise Exception("Appeals can only be filed after a judgment (DECIDED status)")
        if caller != case["filer"]:
            raise Exception("Only the case filer may appeal")
        if case.get("appeal") is not None:
            raise Exception("An appeal has already been filed")
        if len(grounds.strip()) < 20:
            raise Exception("Appeal grounds must be at least 20 characters")
        case["appeal"] = {"appellant": caller, "grounds": grounds.strip()}
        case["status"] = "APPEALED"
        self._save_case(case)

    @gl.public.write
    def request_appeal_judgment(self, case_id: str) -> None:
        case = self._get_case(case_id)
        if case["status"] != "APPEALED":
            raise Exception("Appeal judgment can only be requested when status is APPEALED")
        if not case.get("appeal"):
            raise Exception("No appeal on file")

        case["status"] = "DELIBERATING"
        self._save_case(case)

        final_judgment = self._run_judgment(case, is_appeal=True)
        case["final_judgment"] = final_judgment
        case["status"] = "FINAL"
        self._save_case(case)

    # ── View methods ───────────────────────────────────────────────────────────

    @gl.public.view
    def get_case(self, case_id: str) -> str:
        return self.cases.get(case_id, "")

    @gl.public.view
    def get_cases_by_filer(self, filer: str) -> str:
        raw = self.cases_by_filer.get(filer, "[]")
        ids = json.loads(raw)
        results = []
        for cid in ids:
            data = self.cases.get(cid, "")
            if data:
                results.append(json.loads(data))
        return json.dumps(results)

    @gl.public.view
    def get_recent_cases(self, limit: int) -> str:
        results = []
        ids = list(self.case_ids)
        for cid in reversed(ids):
            if len(results) >= limit:
                break
            data = self.cases.get(cid, "")
            if data:
                results.append(json.loads(data))
        return json.dumps(results)

    @gl.public.view
    def get_case_count(self) -> int:
        return int(self.case_counter)

    @gl.public.view
    def get_stats(self) -> str:
        total = 0
        decided = 0
        pending = 0
        upheld = 0
        dismissed = 0
        partial = 0
        appealed = 0
        for cid in self.case_ids:
            raw = self.cases.get(cid, "")
            if not raw:
                continue
            c = json.loads(raw)
            total += 1
            status = c.get("status", "")
            if status in TERMINAL_STATUSES:
                decided += 1
            elif status in ("SUBMITTED", "RESPONDED", "APPEALED"):
                pending += 1
            j = c.get("final_judgment") or c.get("judgment") or {}
            outcome = j.get("outcome", "")
            if outcome == "UPHELD":
                upheld += 1
            elif outcome == "DISMISSED":
                dismissed += 1
            elif outcome == "PARTIAL":
                partial += 1
            if c.get("appeal"):
                appealed += 1
        return json.dumps({
            "total": total,
            "decided": decided,
            "pending": pending,
            "upheld": upheld,
            "dismissed": dismissed,
            "partial": partial,
            "appealed": appealed,
            "upheld_rate": round(upheld / max(decided, 1), 3),
        })
