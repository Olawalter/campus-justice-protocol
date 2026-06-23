# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class CampusJusticeProtocol(gl.Contract):
    roles: TreeMap[str, str]
    cases: TreeMap[str, str]
    institutions: TreeMap[str, str]
    case_counter: u256
    precedents: DynArray[str]
    admin: str

    def __init__(self, admin_address: str = "0xD9368922786222Ad59fA9C54769927C6DBddB109") -> None:
        self.case_counter = u256(0)
        self.admin = admin_address
        self.roles[admin_address] = "ADMIN"

    def _caller(self) -> str:
        return str(gl.message.sender_address)

    def _require_admin(self) -> None:
        if self.roles.get(self._caller(), "") != "ADMIN":
            raise Exception("Access denied: ADMIN role required")

    def _get_case(self, case_id: str) -> dict:
        raw = self.cases.get(case_id, "")
        if not raw:
            raise Exception(f"Case not found: {case_id}")
        return json.loads(raw)

    def _save_case(self, case: dict) -> None:
        self.cases[case["case_id"]] = json.dumps(case)

    def _next_case_id(self) -> str:
        self.case_counter = self.case_counter + u256(1)
        n = int(self.case_counter)
        return f"CJP-{n:06d}"

    def _precedent_context(self, dispute_type: str) -> str:
        summaries = []
        count = 0
        for pid in self.precedents:
            if count >= 3:
                break
            raw = self.cases.get(pid, "")
            if not raw:
                continue
            c = json.loads(raw)
            if c.get("dispute_type") != dispute_type:
                continue
            j = c.get("judgment") or c.get("appeal_judgment")
            if not j:
                continue
            summaries.append(
                f"[{pid}] {dispute_type} | Outcome: {j['outcome']} "
                f"| Confidence: {j['confidence_score']} "
                f"| Summary: {j['evidence_summary'][:180]}"
            )
            count += 1
        return "\n".join(summaries) if summaries else "No prior precedents for this dispute type."

    def _update_reputation(self, institution_address: str, outcome: str) -> None:
        raw = self.institutions.get(institution_address, "")
        if not raw:
            return
        p = json.loads(raw)
        if outcome == "UPHELD":
            p["upheld_against"] = p.get("upheld_against", 0) + 1
        total = max(p.get("total_cases", 1), 1)
        resolved = p.get("resolved_cases", 0)
        upheld_against = p.get("upheld_against", 0)
        base = resolved / total
        penalty = (upheld_against / total) * 0.4
        p["reputation_score"] = round(max(0.0, min(1.0, base - penalty)), 4)
        self.institutions[institution_address] = json.dumps(p)

    @gl.public.write
    def register_institution(self, institution_address: str, institution_name: str, domain: str) -> None:
        self._require_admin()
        if not institution_name or not domain:
            raise Exception("Institution name and domain are required")
        self.roles[institution_address] = "INSTITUTION"
        profile = {
            "address": institution_address,
            "name": institution_name,
            "domain": domain,
            "verified": False,
            "reputation_score": 0.0,
            "total_cases": 0,
            "resolved_cases": 0,
            "upheld_against": 0,
        }
        self.institutions[institution_address] = json.dumps(profile)

    @gl.public.write
    def verify_institution(self, institution_address: str) -> None:
        self._require_admin()
        raw = self.institutions.get(institution_address, "")
        if not raw:
            raise Exception("Institution not registered")
        p = json.loads(raw)
        p["verified"] = True
        self.institutions[institution_address] = json.dumps(p)

    @gl.public.write
    def register_student(self, student_address: str) -> None:
        self._require_admin()
        self.roles[student_address] = "STUDENT"

    @gl.public.write
    def verify_case(self, case_id: str) -> None:
        self._require_admin()
        case = self._get_case(case_id)
        if case["status"] != "SUBMITTED":
            raise Exception("Case must be SUBMITTED to verify")
        case["status"] = "VERIFIED"
        self._save_case(case)

    @gl.public.write
    def notify_institution(self, case_id: str) -> None:
        self._require_admin()
        case = self._get_case(case_id)
        if case["status"] != "VERIFIED":
            raise Exception("Case must be VERIFIED before notifying institution")
        case["status"] = "INSTITUTION_NOTIFIED"
        self._save_case(case)

    @gl.public.write
    def set_admin(self, new_admin: str) -> None:
        self._require_admin()
        old = self.admin
        self.roles[old] = "STUDENT"
        self.roles[new_admin] = "ADMIN"
        self.admin = new_admin

    @gl.public.write
    def create_case(
        self,
        institution_address: str,
        dispute_type: str,
        description: str,
        evidence_hashes: str,
        matric_number: str,
        department: str,
    ) -> str:
        caller = self._caller()
        role = self.roles.get(caller, "")
        if role == "INSTITUTION":
            raise Exception("Institutions cannot file student disputes")
        if role == "":
            self.roles[caller] = "STUDENT"
        raw_inst = self.institutions.get(institution_address, "")
        if raw_inst:
            inst = json.loads(raw_inst)
        else:
            inst = {
                "address": institution_address,
                "name": "Unregistered Institution",
                "domain": "",
                "verified": True,
                "reputation_score": 50,
                "total_cases": 0,
                "resolved_cases": 0,
                "appeal_success_rate": 0.0,
                "avg_resolution_days": 0,
            }
            self.institutions[institution_address] = json.dumps(inst)
        valid_types = [
            "GPA_MISCALCULATION", "DEGREE_CLASSIFICATION", "MISSING_GRADE",
            "TRANSCRIPT_DISPUTE", "SCHOLARSHIP_DISPUTE", "WRONGFUL_SUSPENSION",
            "EXPULSION_APPEAL", "FEE_DISPUTE", "HOSTEL_ALLOCATION",
            "THESIS_GRADING", "SEXUAL_HARASSMENT", "OTHER",
        ]
        if dispute_type not in valid_types:
            raise Exception(f"Invalid dispute type: {dispute_type}")
        if len(description) < 50:
            raise Exception("Description must be at least 50 characters")
        hashes = json.loads(evidence_hashes) if evidence_hashes else []
        if len(hashes) > 10:
            raise Exception("Maximum 10 evidence files per case")
        case_id = self._next_case_id()
        case = {
            "case_id": case_id,
            "filer": caller,
            "institution": institution_address,
            "institution_name": inst["name"],
            "dispute_type": dispute_type,
            "description": description,
            "matric_number": matric_number,
            "department": department,
            "status": "SUBMITTED",
            "evidence_hashes": hashes,
            "response_text": "",
            "response_hashes": [],
            "judgment": None,
            "appeal": None,
            "appeal_judgment": None,
            "precedent_refs": [],
        }
        self._save_case(case)
        inst["total_cases"] = inst.get("total_cases", 0) + 1
        self.institutions[institution_address] = json.dumps(inst)
        return case_id

    @gl.public.write
    def add_student_evidence(self, case_id: str, new_hashes_json: str) -> None:
        case = self._get_case(case_id)
        caller = self._caller()
        if case["filer"] != caller:
            raise Exception("Only the case filer can add evidence")
        if case["status"] not in ("SUBMITTED", "VERIFIED", "INSTITUTION_NOTIFIED"):
            raise Exception("Evidence can only be added before institution response")
        new_hashes = json.loads(new_hashes_json) if new_hashes_json else []
        existing = case.get("evidence_hashes", [])
        if len(existing) + len(new_hashes) > 10:
            raise Exception("Maximum 10 evidence files total")
        case["evidence_hashes"] = existing + new_hashes
        self._save_case(case)

    @gl.public.write
    def file_appeal(self, case_id: str, grounds: str) -> None:
        case = self._get_case(case_id)
        caller = self._caller()
        if case["status"] != "JUDGMENT_ISSUED":
            raise Exception("Appeals can only be filed after a judgment is issued")
        if caller not in (case["filer"], case["institution"]):
            raise Exception("Only case parties may appeal")
        if len(grounds) < 20:
            raise Exception("Appeal grounds must be at least 20 characters")
        if len(grounds) > 2000:
            raise Exception("Appeal grounds must not exceed 2000 characters")
        if case.get("appeal") is not None:
            raise Exception("An appeal has already been filed for this case")
        case["appeal"] = {"appellant": caller, "grounds": grounds}
        case["status"] = "APPEALED"
        self._save_case(case)

    @gl.public.write
    def submit_response(self, case_id: str, response_text: str, response_hashes_json: str) -> None:
        case = self._get_case(case_id)
        caller = self._caller()
        if case["institution"] != caller:
            raise Exception("Only the named institution can respond")
        if case["status"] != "INSTITUTION_NOTIFIED":
            raise Exception("Case must be in INSTITUTION_NOTIFIED status")
        if len(response_text) < 30:
            raise Exception("Response must be at least 30 characters")
        response_hashes = json.loads(response_hashes_json) if response_hashes_json else []
        case["response_text"] = response_text
        case["response_hashes"] = response_hashes
        case["status"] = "RESPONDED"
        self._save_case(case)

    @gl.public.write
    def close_case(self, case_id: str) -> None:
        case = self._get_case(case_id)
        caller = self._caller()
        if case["status"] not in ("JUDGMENT_ISSUED", "FINAL_JUDGMENT"):
            raise Exception("Case must have a judgment before closing")
        if caller not in (case["filer"], case["institution"], self.admin):
            raise Exception("Only case parties or admin can close a case")
        case["status"] = "CLOSED"
        self._save_case(case)
        raw_inst = self.institutions.get(case["institution"], "")
        if raw_inst:
            inst = json.loads(raw_inst)
            inst["resolved_cases"] = inst.get("resolved_cases", 0) + 1
            self.institutions[case["institution"]] = json.dumps(inst)

    @gl.public.write
    def evaluate_case(self, case_id: str) -> None:
        case = self._get_case(case_id)
        caller = self._caller()
        if case["status"] != "RESPONDED":
            raise Exception("Case must be in RESPONDED status to evaluate")
        if caller not in (case["filer"], case["institution"], self.admin):
            raise Exception("Only case parties or admin can trigger evaluation")
        case["status"] = "DELIBERATING"
        self._save_case(case)

        description = case["description"]
        dispute_type = case["dispute_type"]
        institution_name = case["institution_name"]
        department = case["department"]
        response_text = case["response_text"]
        evidence_count = len(case.get("evidence_hashes", []))
        response_count = len(case.get("response_hashes", []))
        precedent_context = self._precedent_context(dispute_type)

        prompt = (
            "You are an impartial AI arbitrator for the Campus Justice Protocol, "
            "a decentralized academic dispute resolution system.\n\n"
            "Evaluate this academic dispute and respond ONLY with a valid JSON object.\n\n"
            f"CASE: {case_id}\n"
            f"INSTITUTION: {institution_name}\n"
            f"DEPARTMENT: {department}\n"
            f"DISPUTE TYPE: {dispute_type.replace('_', ' ').title()}\n"
            f"STUDENT EVIDENCE FILES: {evidence_count}\n"
            f"INSTITUTION EVIDENCE FILES: {response_count}\n\n"
            f"STUDENT COMPLAINT:\n{description}\n\n"
            f"INSTITUTION RESPONSE:\n{response_text}\n\n"
            f"SIMILAR PRECEDENTS:\n{precedent_context}\n\n"
            "EVALUATION CRITERIA:\n"
            "1. Did the institution follow its own published academic regulations?\n"
            "2. Which party presented stronger, more specific evidence?\n"
            "3. Is the institution position proportionate and consistent?\n"
            "4. How does this compare to similar precedent cases?\n\n"
            'Respond ONLY with this JSON (no markdown, no extra text):\n'
            '{\n'
            '  "outcome": "UPHELD or REJECTED or FURTHER_REVIEW or SETTLEMENT_RECOMMENDED",\n'
            '  "reasoning": "Full explanation referencing specific facts. Minimum 3 sentences.",\n'
            '  "evidence_summary": "Assessment of evidence quality from both sides. 2 sentences.",\n'
            '  "confidence_score": 0.85,\n'
            '  "key_factors": ["factor one", "factor two", "factor three"],\n'
            '  "recommendations": "What either party should do next."\n'
            '}\n\n'
            "Outcome meanings:\n"
            "- UPHELD: student complaint is valid, institution should correct the record\n"
            "- REJECTED: institution position is correct, complaint lacks merit\n"
            "- FURTHER_REVIEW: insufficient evidence, independent review required\n"
            "- SETTLEMENT_RECOMMENDED: both parties have valid points, negotiate"
        )

        def nondet() -> str:
            raw = gl.nondet.exec_prompt(prompt)
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                cleaned = "\n".join(lines[1:-1]).strip()
            parsed = json.loads(cleaned)
            outcome = str(parsed.get("outcome", "FURTHER_REVIEW")).upper()
            valid_outcomes = ["UPHELD", "REJECTED", "FURTHER_REVIEW", "SETTLEMENT_RECOMMENDED"]
            if outcome not in valid_outcomes:
                outcome = "FURTHER_REVIEW"
            confidence = float(parsed.get("confidence_score", 0.5))
            confidence = max(0.0, min(1.0, confidence))
            normalized = {
                "outcome": outcome,
                "reasoning": str(parsed.get("reasoning", "")),
                "evidence_summary": str(parsed.get("evidence_summary", "")),
                "confidence_score": round(confidence, 4),
                "key_factors": list(parsed.get("key_factors", [])),
                "recommendations": str(parsed.get("recommendations", "")),
            }
            return json.dumps(normalized, sort_keys=True)

        result_str = gl.eq_principle.prompt_comparative(nondet)
        judgment = json.loads(result_str)
        case["judgment"] = judgment
        case["status"] = "JUDGMENT_ISSUED"
        self._save_case(case)
        self._update_reputation(case["institution"], judgment["outcome"])
        if judgment["outcome"] in ("UPHELD", "REJECTED") and judgment["confidence_score"] >= 0.7:
            if case_id not in list(self.precedents):
                self.precedents.append(case_id)

    @gl.public.write
    def evaluate_appeal(self, case_id: str) -> None:
        case = self._get_case(case_id)
        caller = self._caller()
        if case["status"] != "APPEALED":
            raise Exception("Case must be in APPEALED status")
        if caller not in (case["filer"], case["institution"], self.admin):
            raise Exception("Only case parties or admin can trigger appeal evaluation")
        appeal = case.get("appeal")
        if not appeal:
            raise Exception("No appeal filed for this case")

        original = case.get("judgment") or {}
        description = case["description"]
        dispute_type = case["dispute_type"]
        institution_name = case["institution_name"]
        department = case["department"]
        response_text = case["response_text"]
        appellant_role = "Student" if appeal["appellant"] == case["filer"] else "Institution"
        appeal_grounds = appeal["grounds"]
        orig_outcome = original.get("outcome", "UNKNOWN")
        orig_reasoning = original.get("reasoning", "")
        orig_confidence = original.get("confidence_score", 0)
        precedent_context = self._precedent_context(dispute_type)

        prompt = (
            "You are a senior AI arbitrator for the Campus Justice Protocol Appeal Panel.\n"
            "This is a FINAL appeal review. Your decision cannot be appealed further.\n\n"
            f"CASE: {case_id}\n"
            f"INSTITUTION: {institution_name}\n"
            f"DEPARTMENT: {department}\n"
            f"DISPUTE TYPE: {dispute_type.replace('_', ' ').title()}\n\n"
            f"STUDENT COMPLAINT:\n{description}\n\n"
            f"INSTITUTION RESPONSE:\n{response_text}\n\n"
            f"ORIGINAL JUDGMENT:\n"
            f"Outcome: {orig_outcome}\n"
            f"Confidence: {orig_confidence}\n"
            f"Reasoning: {orig_reasoning}\n\n"
            f"APPEAL FILED BY: {appellant_role}\n"
            f"APPEAL GROUNDS:\n{appeal_grounds}\n\n"
            f"SIMILAR PRECEDENTS:\n{precedent_context}\n\n"
            "APPEAL REVIEW CRITERIA:\n"
            "1. Are the appeal grounds procedurally and substantively valid?\n"
            "2. Was significant evidence overlooked or misweighed in the original judgment?\n"
            "3. Does the original reasoning contain factual errors or logical gaps?\n"
            "4. Is the original outcome consistent with established precedents?\n\n"
            'Respond ONLY with this JSON (no markdown, no extra text):\n'
            '{\n'
            '  "outcome": "UPHELD or REJECTED or FURTHER_REVIEW or SETTLEMENT_RECOMMENDED",\n'
            '  "reasoning": "Complete independent analysis addressing the appeal grounds. Minimum 4 sentences.",\n'
            '  "evidence_summary": "Re-assessment of all evidence including appeal context. 2 sentences.",\n'
            '  "confidence_score": 0.90,\n'
            '  "appeal_assessment": "Direct assessment of whether the appeal grounds have merit. 2 sentences.",\n'
            '  "key_factors": ["factor one", "factor two", "factor three"],\n'
            '  "recommendations": "Final implementation recommendations."\n'
            '}'
        )

        def nondet() -> str:
            raw = gl.nondet.exec_prompt(prompt)
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                cleaned = "\n".join(lines[1:-1]).strip()
            parsed = json.loads(cleaned)
            outcome = str(parsed.get("outcome", "FURTHER_REVIEW")).upper()
            valid_outcomes = ["UPHELD", "REJECTED", "FURTHER_REVIEW", "SETTLEMENT_RECOMMENDED"]
            if outcome not in valid_outcomes:
                outcome = "FURTHER_REVIEW"
            confidence = float(parsed.get("confidence_score", 0.5))
            confidence = max(0.0, min(1.0, confidence))
            normalized = {
                "outcome": outcome,
                "reasoning": str(parsed.get("reasoning", "")),
                "evidence_summary": str(parsed.get("evidence_summary", "")),
                "confidence_score": round(confidence, 4),
                "appeal_assessment": str(parsed.get("appeal_assessment", "")),
                "key_factors": list(parsed.get("key_factors", [])),
                "recommendations": str(parsed.get("recommendations", "")),
            }
            return json.dumps(normalized, sort_keys=True)

        result_str = gl.eq_principle.prompt_comparative(nondet)
        appeal_judgment = json.loads(result_str)
        case["appeal_judgment"] = appeal_judgment
        case["status"] = "FINAL_JUDGMENT"
        self._save_case(case)
        self._update_reputation(case["institution"], appeal_judgment["outcome"])
        if appeal_judgment["outcome"] in ("UPHELD", "REJECTED") and appeal_judgment["confidence_score"] >= 0.75:
            if case_id not in list(self.precedents):
                self.precedents.append(case_id)

    @gl.public.view
    def get_case(self, case_id: str) -> str:
        return self.cases.get(case_id, "")

    @gl.public.view
    def get_cases_by_student(self, student_address: str) -> str:
        results = []
        for case_id in self.cases:
            raw = self.cases.get(case_id, "")
            if not raw:
                continue
            c = json.loads(raw)
            if c.get("filer") == student_address:
                results.append(c)
        return json.dumps(results)

    @gl.public.view
    def get_cases_by_institution(self, institution_address: str) -> str:
        results = []
        for case_id in self.cases:
            raw = self.cases.get(case_id, "")
            if not raw:
                continue
            c = json.loads(raw)
            if c.get("institution") == institution_address:
                results.append(c)
        return json.dumps(results)

    @gl.public.view
    def get_cases_by_status(self, status: str) -> str:
        results = []
        for case_id in self.cases:
            raw = self.cases.get(case_id, "")
            if not raw:
                continue
            c = json.loads(raw)
            if c.get("status") == status:
                results.append(c)
        return json.dumps(results)

    @gl.public.view
    def get_institution_profile(self, institution_address: str) -> str:
        return self.institutions.get(institution_address, "")

    @gl.public.view
    def get_all_institutions(self) -> str:
        results = []
        for addr in self.institutions:
            raw = self.institutions.get(addr, "")
            if raw:
                results.append(json.loads(raw))
        return json.dumps(results)

    @gl.public.view
    def get_precedents(self, dispute_type: str, limit: int) -> str:
        results = []
        for pid in self.precedents:
            if len(results) >= limit:
                break
            raw = self.cases.get(pid, "")
            if not raw:
                continue
            c = json.loads(raw)
            if not dispute_type or c.get("dispute_type") == dispute_type:
                results.append(c)
        return json.dumps(results)

    @gl.public.view
    def get_all_precedents(self, limit: int) -> str:
        results = []
        pids = list(self.precedents)
        for pid in reversed(pids):
            if len(results) >= limit:
                break
            raw = self.cases.get(pid, "")
            if raw:
                results.append(json.loads(raw))
        return json.dumps(results)

    @gl.public.view
    def get_case_judgment(self, case_id: str) -> str:
        raw = self.cases.get(case_id, "")
        if not raw:
            raise Exception(f"Case not found: {case_id}")
        c = json.loads(raw)
        if c.get("appeal_judgment"):
            return json.dumps(c["appeal_judgment"])
        if c.get("judgment"):
            return json.dumps(c["judgment"])
        return ""

    @gl.public.view
    def verify_evidence_hash(self, case_id: str, hash_to_verify: str) -> bool:
        raw = self.cases.get(case_id, "")
        if not raw:
            return False
        c = json.loads(raw)
        all_hashes = c.get("evidence_hashes", []) + c.get("response_hashes", [])
        return hash_to_verify in all_hashes

    @gl.public.view
    def get_transparency_stats(self) -> str:
        total = 0
        resolved = 0
        pending = 0
        deliberating = 0
        appealed = 0
        judged = 0
        upheld = 0
        rejected = 0
        for case_id in self.cases:
            raw = self.cases.get(case_id, "")
            if not raw:
                continue
            c = json.loads(raw)
            total += 1
            status = c.get("status", "")
            if status in ("JUDGMENT_ISSUED", "FINAL_JUDGMENT", "CLOSED"):
                resolved += 1
            if status in ("SUBMITTED", "VERIFIED", "INSTITUTION_NOTIFIED", "RESPONDED"):
                pending += 1
            if status == "DELIBERATING":
                deliberating += 1
            if c.get("appeal") is not None:
                appealed += 1
            j = c.get("judgment")
            if j:
                judged += 1
                if j.get("outcome") == "UPHELD":
                    upheld += 1
                if j.get("outcome") == "REJECTED":
                    rejected += 1
        inst_count = 0
        verified_count = 0
        for addr in self.institutions:
            raw = self.institutions.get(addr, "")
            if not raw:
                continue
            p = json.loads(raw)
            inst_count += 1
            if p.get("verified"):
                verified_count += 1
        stats = {
            "total_cases": total,
            "resolved_cases": resolved,
            "pending_cases": pending,
            "deliberating_cases": deliberating,
            "appeal_rate": round(appealed / max(resolved, 1), 4),
            "upheld_rate": round(upheld / max(judged, 1), 4),
            "rejected_rate": round(rejected / max(judged, 1), 4),
            "institution_count": inst_count,
            "verified_institutions": verified_count,
            "precedent_count": len(self.precedents),
        }
        return json.dumps(stats)

    @gl.public.view
    def get_institution_leaderboard(self) -> str:
        profiles = []
        for addr in self.institutions:
            raw = self.institutions.get(addr, "")
            if raw:
                profiles.append(json.loads(raw))
        profiles.sort(key=lambda p: p.get("reputation_score", 0.0), reverse=True)
        return json.dumps(profiles)

    @gl.public.view
    def get_role(self, address: str) -> str:
        return self.roles.get(address, "UNREGISTERED")

    @gl.public.view
    def is_institution_verified(self, institution_address: str) -> bool:
        raw = self.institutions.get(institution_address, "")
        if not raw:
            return False
        return json.loads(raw).get("verified", False)
