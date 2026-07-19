# Campus Justice Protocol

> A decentralized AI arbitration system for university disputes — powered by GenLayer intelligent contracts and Optimistic Democracy.

**Live:** [campusjp.vercel.app](https://campusjp.vercel.app) · **Chain:** GenLayer Studionet (61999) · **Contract:** `0xD5d9875ef33c369A59e47c2a0348f0e18897436D`

**Stack:** Next.js 15 · TypeScript · Tailwind CSS 4 · genlayer-js 1.1.8

---

## Submission Notes

Campus Justice Protocol is a decentralized arbitration system for university disputes. Students file a case, submit evidence (including live URLs to policy documents), and the institution responds on-chain using their wallet. When either party requests judgment, GenLayer's 5 validators each independently fetch the linked policy document and evidence URLs from the live web, run an AI analysis of the full case, and reach consensus via Optimistic Democracy. The final judgment — outcome, reasoning, key findings, confidence score, and recommendation — is written permanently to the contract. Students can then appeal, triggering a second validator consensus round that re-evaluates with the appeal grounds.

**The trust problem it solves:** University dispute processes are slow, opaque, and fully controlled by the institution being disputed. There is no audit trail, no neutral arbitrator, and no way for students to verify that a decision was fairly reached. CJP replaces that with a public, on-chain record where every judgment is verifiable, every validator vote is visible, and no single party controls the outcome.

**How to use it:**
1. Go to [campusjp.vercel.app](https://campusjp.vercel.app) and connect a MetaMask wallet on GenLayer Studionet
2. Click **File a Case** — fill in case type, description, evidence refs, and optionally a policy document URL
3. The institution connects a separate wallet and submits their official response
4. Either party clicks **Request AI Judgment** — validators fetch live evidence and reach consensus (5–15 min)
5. The judgment appears on the case page with full reasoning, findings, and per-validator vote breakdown
6. The student can file an appeal; a second consensus round produces the final judgment

---

## What is this?

Universities handle hundreds of disputes every year — grade appeals, exam misconduct, scholarship decisions, hostel allocations — and most go through slow, opaque, human-only processes with no audit trail.

Campus Justice Protocol puts the arbitration on-chain. When a student files a case, each GenLayer validator independently fetches live URL evidence from the web, runs an AI model, and reaches consensus via Optimistic Democracy. The judgment — including full reasoning, key findings, confidence score, and recommendation — is written permanently to the contract. No central authority. No black box. Every decision is publicly verifiable.

---

## Case Types

| Type | Description |
|---|---|
| 🎓 Academic Grade Appeal | Dispute over grades, marking, or assessment outcomes |
| 📋 Exam Misconduct | Allegations of cheating, plagiarism, or invigilation failures |
| 📢 Student Complaint | General complaints against staff or university policy |
| 🗳️ Election Dispute | Student union or faculty election irregularities |
| 💰 Scholarship Decision | Appeals on scholarship award or revocation |
| 🏠 Hostel Allocation | Disputes over room assignments or hostel policy |
| 🔬 Research Funding | Disputes over grant allocation or research support |

---

## How It Works

```
Student files case  →  Evidence submitted (text refs + live URLs + policy document URL)
        ↓
Action Room opens — institution connects wallet and responds
        ↓
Student requests AI judgment
        ↓
GenLayer validators independently fetch policy URL + evidence URLs from the live web
        ↓
Each validator runs the full AI analysis with real fetched content injected into the prompt
        ↓
Optimistic Democracy + Equivalence Principle → consensus reached
        ↓
Judgment written to contract: outcome, reasoning, findings, recommendation, confidence
        ↓
Validator Consensus Panel shows per-validator votes, rounds, agreement rate
        ↓
Student can file appeal → senior arbitrator re-evaluates with appeal grounds
        ↓
Final judgment — immutable, publicly auditable
```

Each judgment contains:
- **Outcome** — `UPHELD` / `DISMISSED` / `PARTIAL` / `INCONCLUSIVE`
- **Reasoning** — Thorough AI analysis citing specific case facts and fetched evidence
- **Key Findings** — 3+ concrete findings from the case
- **Recommendation** — Specific actionable next step
- **Confidence Score** — 0–1 float based on evidence strength
- **Validator Consensus** — Per-validator votes (agree/disagree/idle/timeout), rounds, leader, agreement rate

---

## GenLayer Capabilities Used

| Capability | How CJP uses it |
|---|---|
| `gl.Contract` | Base class for the entire intelligent contract |
| `gl.public.write` | `file_case`, `submit_response`, `request_judgment`, `file_appeal`, `request_appeal_judgment` |
| `gl.public.view` | `get_case`, `get_recent_cases`, `get_case_count`, `get_stats` |
| `gl.message.sender_address` | Identifies filer, records respondent, restricts appeal to original filer |
| `gl.nondet` block | Wraps all AI + web work — each of 5 validators runs independently in its own sandbox |
| `gl.nondet.web.get` | Live URL fetching inside nondet — each validator fetches the institution policy document and every `https://` evidence ref independently before inference |
| `gl.nondet.exec_prompt` | LLM call inside each validator's sandbox — runs full case analysis with fetched evidence injected |
| `gl.eq_principle.prompt_non_comparative` | Consensus over non-deterministic LLM + web output — validates structure against task/criteria rather than requiring byte-identical results |
| `TreeMap[str, str]` | On-chain case storage (`cases`) and filer index (`cases_by_filer`) |
| `DynArray[str]` | Ordered case ID list for pagination in `get_recent_cases` |
| `u256` | Case counter — generates sequential IDs like `CJP-000001` |
| `genlayer-js` SDK | `createClient`, `createAccount`, `readContract`, `writeContract`, `waitForTransactionReceipt` |
| EIP-3326 / EIP-3085 | `wallet_switchEthereumChain` / `wallet_addEthereumChain` for automatic network management |

---

## Tech Stack

### Frontend
| Tool | Version | Role |
|---|---|---|
| Next.js | 15 (App Router, Turbopack) | Framework |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 (CSS-first config) | Styling |
| genlayer-js | 1.1.8 | GenLayer client SDK |

### Smart Contract
| Tool | Role |
|---|---|
| Python (GenLayer) | Intelligent contract language |
| `gl.nondet.exec_prompt` | LLM inference inside validators |
| `gl.nondet.web.get` | Live web / URL evidence fetching |
| `gl.eq_principle.prompt_non_comparative` | Non-deterministic consensus |
| GenLayer Studionet | Deployment chain (ID: 61999) |

### Wallet
- MetaMask or Rabby (any EIP-1193 injected provider)
- Network auto-added via `wallet_addEthereumChain` (EIP-3085)
- No `client.connect()` — avoids `wallet_getSnaps` incompatibility

---

## Project Structure

```
campus-justice-protocol/
├── contracts/
│   └── src/
│       └── campus_justice_protocol.py   # GenLayer intelligent contract
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                 # Landing page
│   │   │   ├── cases/                   # Public case feed + detail page
│   │   │   ├── my-cases/                # Wallet-linked case dashboard
│   │   │   └── file/                    # 3-step case filing form
│   │   ├── components/
│   │   │   ├── cases/
│   │   │   │   ├── CaseCard.tsx         # Case summary card for feeds
│   │   │   │   ├── FileCaseForm.tsx     # 3-step filing form with policy URL input
│   │   │   │   ├── JudgmentPanel.tsx    # Renders judgment outcome, reasoning, findings
│   │   │   │   └── ValidatorConsensusPanel.tsx  # Per-validator vote breakdown panel
│   │   │   └── ui/                      # StatusBadge, Navbar
│   │   ├── contexts/
│   │   │   └── WalletContext.tsx        # Wallet state + all write operations
│   │   └── lib/
│   │       ├── genlayer.ts              # Read client + contract reads
│   │       ├── constants.ts             # Contract address, chain ID, metadata
│   │       └── types.ts                 # Case, Judgment, Appeal TypeScript types
│   ├── .env.local                       # Environment variables (not committed)
│   └── package.json
├── scripts/
│   └── e2e_test.mjs                     # End-to-end test script (genlayer-js, real wallets)
└── README.md
```

---

## Local Development

### Prerequisites
- Node.js 20+
- MetaMask or Rabby browser extension
- GEN tokens on GenLayer Studionet → [studio.genlayer.com](https://studio.genlayer.com)

### 1. Clone and install

```bash
git clone https://github.com/Olawalter/campus-justice-protocol.git
cd campus-justice-protocol/frontend
npm install
```

### 2. Environment variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0xD5d9875ef33c369A59e47c2a0348f0e18897436D
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_APP_URL=https://campusjp.vercel.app
```

### 3. Run the dev server

```bash
npm run dev
# → http://localhost:3001
```

### 4. Connect your wallet

Open the app, click **Connect Wallet** — MetaMask auto-adds GenLayer Studionet if not already configured.

### 5. Run the end-to-end test

```bash
cd frontend
node --input-type=module < ../scripts/e2e_test.mjs
```

This files a real case, submits a response, triggers AI judgment, files an appeal, and triggers the appeal judgment — all against the live contract using funded wallets. Expect 15–30 minutes for both validator rounds.

---

## Deploying the Contract

The intelligent contract lives in `contracts/src/campus_justice_protocol.py`.

1. Go to [GenLayer Studio](https://studio.genlayer.com)
2. Paste the contract file into the editor
3. Click **Deploy** — no constructor arguments required
4. Copy the deployed contract address
5. Update `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS` in `.env.local` and in Vercel environment variables

---

## Contract Overview

```python
class CampusJusticeProtocol(gl.Contract):
    cases: TreeMap[str, str]           # case_id → JSON
    case_ids: DynArray[str]            # ordered list for pagination
    cases_by_filer: TreeMap[str, str]  # address → case IDs
    case_counter: u256
```

### Write Methods

| Method | Description |
|---|---|
| `file_case(case_type, title, description, evidence_refs, matric_number, department, filed_at, policy_url)` | File a new dispute case with optional institution policy document URL |
| `submit_response(case_id, response_text)` | Institution submits official response |
| `request_judgment(case_id)` | Trigger AI judgment — validators fetch policy URL + evidence and run LLM |
| `file_appeal(case_id, grounds)` | Filer appeals a DECIDED case |
| `request_appeal_judgment(case_id)` | Trigger senior AI re-evaluation of appeal |

### Read Methods

| Method | Returns |
|---|---|
| `get_case(case_id)` | JSON string of a single case |
| `get_recent_cases(limit)` | JSON array of latest N cases |
| `get_cases_by_filer(address)` | JSON array of cases filed by address |
| `get_case_count()` | Total cases filed |
| `get_stats()` | Aggregate stats — totals, outcomes, upheld rate |

### Case Status Flow

```
SUBMITTED → RESPONDED → [request_judgment] → DELIBERATING → DECIDED
                                                                ↓
                                                         [file_appeal]
                                                                ↓
                                               APPEALED → DELIBERATING → FINAL
```

---

## Key Design Decisions

**Live URL evidence fetching inside `nondet()`**
When `request_judgment` is called, each validator independently runs `gl.nondet.web.get(url)` for the institution policy document URL and for every `https://` evidence reference submitted with the case. The fetched content (up to 5,000 chars for the policy doc, 3,000 chars per evidence URL) is injected into the AI prompt before inference. Validators analyze real live documents, not just reference strings. Storage access (`self.*`) is forbidden inside `nondet()` blocks — all values are captured as plain Python closure variables before the block opens.

**`prompt_non_comparative` instead of `prompt_comparative`**
`prompt_comparative` requires all 5 validators to produce byte-identical LLM outputs. LLMs are inherently non-deterministic — the same prompt yields different phrasings every run. `prompt_non_comparative` lets each validator produce its own output and validates it against `task`/`criteria` constraints instead. This makes consensus reliable across real AI inference.

**Validator Consensus Panel**
After each judgment, the frontend reads the transaction receipt's `consensus_data` to display per-validator votes (agree/disagree/idle/timeout), the consensus result name, number of rounds, leader address, and agreement rate as a visual progress bar. This exposes GenLayer's Optimistic Democracy mechanism directly to the user rather than hiding it behind a black-box result.

**Action Room — staged case flow**
The case detail page uses a progressive "Action Room" model: after filing, the case is explicitly open for institution response before judgment can be requested. The UI gates each party's action on the current case status with a process timeline showing where the case stands. This matches how real university proceedings work.

**Precedent context injection**
Before each judgment, the contract scans up to 3 prior decided cases of the same type and injects their outcome, confidence score, and reasoning summary into the prompt. Later cases are contextually consistent with earlier ones of the same category — the system builds institutional memory on-chain.

**Markdown fence stripping**
GenLayer validators sometimes wrap LLM output in ```json ... ``` markdown fences even when instructed to return raw JSON. The contract strips fences before `json.loads` to prevent `JSONDecodeError` from crashing the execution after consensus is already reached.

**Non-blocking judgment transactions**
`request_judgment` triggers LLM execution across validators, which takes 5–15 minutes. The frontend submits the tx, returns the hash immediately, and polls `readCase()` every 15 seconds until status becomes `DECIDED` or `FINAL`. The deliberating UI keeps users informed throughout without blocking the session.

---

## Roadmap

CJP is built on a problem that exists at every university. The current implementation covers the core arbitration flow end-to-end. Here is the path forward:

**Near-term**
- **Reputation scoring** — validators and institutions build on-chain track records based on case outcomes; institutions with repeated procedural violations are flagged publicly
- **Multi-institution support** — universities deploy their own contract instances; a factory contract manages discovery and cross-institution precedent sharing
- **Email/notification layer** — off-chain notifications when case status changes, keeping non-crypto-native students informed without requiring them to poll the app

**Medium-term**
- **Document verification** — integrate IPFS or Arweave so evidence documents are content-addressed and tamper-proof, not just linked by URL
- **Structured policy ingestion** — institutions upload their policy handbooks on-chain; validators reference the authoritative stored version rather than fetching from a potentially mutable URL
- **Appeals committee simulation** — multi-round deliberation where validators represent different committee roles (procedural reviewer, subject expert, student advocate)

**Long-term**
- **Cross-chain deployment** — port to GenLayer mainnet; explore bridging judgment outcomes to other chains for credential verification
- **Open arbitration protocol** — CJP as a base layer that any organization (not just universities) can deploy for transparent dispute resolution: employer/employee disputes, DAO governance appeals, tenant/landlord complaints

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend` in project settings → Build & Development Settings
4. Add environment variables matching `.env.local`
5. Deploy — every push to `main` triggers an automatic production deployment

---

## License

MIT © 2026 Walter Olaolu
