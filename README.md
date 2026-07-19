# Campus Justice Protocol

> A decentralized AI arbitration system for university disputes — powered by GenLayer intelligent contracts and Optimistic Democracy.

**Live:** [campusjp.vercel.app](https://campusjp.vercel.app) · **Chain:** GenLayer Studionet (61999) · **Contract:** `0x46F3A73A7e7Fb331aA1b430d2FCb7eFEBD852CAe`

**Stack:** Next.js 15 · TypeScript · Tailwind CSS 4 · genlayer-js 1.1.8

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
Student files case  →  Evidence submitted (text refs + live URLs)
        ↓
Action Room opens — institution connects wallet and responds
        ↓
Student requests AI judgment
        ↓
GenLayer validators independently fetch URL evidence from the live web
        ↓
Each validator runs the full AI analysis with real evidence injected
        ↓
Optimistic Democracy + Equivalence Principle → consensus reached
        ↓
Judgment written to contract: outcome, reasoning, findings, recommendation
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
- **Validator Consensus** — Reached via GenLayer Optimistic Democracy (5 validators)

---

## GenLayer Capabilities Used

| Capability | How CJP uses it |
|---|---|
| `gl.Contract` | Base class for the entire intelligent contract |
| `gl.public.write` | `file_case`, `submit_response`, `request_judgment`, `file_appeal`, `request_appeal_judgment` |
| `gl.public.view` | `get_case`, `get_recent_cases`, `get_case_count`, `get_stats` |
| `gl.message.sender_address` | Identifies filer and restricts appeal to original filer |
| `gl.nondet.exec_prompt` | LLM call inside each validator's sandbox |
| `gl.nondet.web.get` | Live URL evidence fetching — each validator fetches independently |
| `gl.eq_principle.prompt_non_comparative` | Consensus over non-deterministic LLM + web output |
| `TreeMap[str, str]` | On-chain case storage and filer index |
| `DynArray[str]` | Ordered case ID list for iteration and pagination |
| `u256` | Case counter |
| `genlayer-js` SDK | `createClient`, `readContract`, `writeContract`, `waitForTransactionReceipt` |
| EIP-3326 / EIP-3085 | `wallet_switchEthereumChain` / `wallet_addEthereumChain` for network management |

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
│   │   │   ├── cases/                   # CaseCard, FileCaseForm, JudgmentPanel
│   │   │   └── ui/                      # StatusBadge, Navbar
│   │   ├── contexts/
│   │   │   └── WalletContext.tsx        # Wallet state + all write operations
│   │   └── lib/
│   │       ├── genlayer.ts              # Read client + contract reads
│   │       ├── constants.ts             # Contract address, chain ID, metadata
│   │       └── types.ts                 # Case, Judgment, Appeal TypeScript types
│   ├── .env.local                       # Environment variables (not committed)
│   └── package.json
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
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0x46F3A73A7e7Fb331aA1b430d2FCb7eFEBD852CAe
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
| `file_case(case_type, title, description, evidence_refs, matric_number, department, filed_at)` | File a new dispute case |
| `submit_response(case_id, response_text)` | Institution submits official response |
| `request_judgment(case_id)` | Trigger AI judgment — validators fetch URL evidence + run LLM |
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
SUBMITTED → RESPONDED? → [request_judgment] → DELIBERATING → DECIDED
                                                                  ↓
                                                           [file_appeal]
                                                                  ↓
                                                    APPEALED → DELIBERATING → FINAL
```

---

## Key Design Decisions

**Live URL evidence fetching inside `nondet()`**
When `request_judgment` is called, each validator independently runs `gl.nondet.web.get(url)` for every `https://` evidence reference submitted with the case. The fetched content (up to 3,000 chars per URL) is injected into the AI prompt before inference. This means validators analyze real documents, not just reference strings. Storage access (`self.*`) is forbidden inside `nondet()` blocks — the fetch logic operates entirely on closure variables captured before the nondet block starts.

**`prompt_non_comparative` instead of `prompt_comparative`**
`prompt_comparative` requires all 5 validators to produce byte-identical LLM outputs. LLMs are inherently non-deterministic — the same prompt yields different phrasings every run. `prompt_non_comparative` lets each validator produce its own output and validates it against `task`/`criteria` constraints instead. This makes consensus reliable across real AI inference.

**Action Room — staged case flow**
The case detail page uses a progressive "Action Room" model: after filing, the case is explicitly open for institution response before judgment can be requested. The UI gates each party's action on the current case status, with a process timeline showing where the case stands. This matches how real university proceedings work.

**Client-side address filtering for My Cases**
GenLayer Python stores `gl.message.sender_address` as a lowercase hex string. MetaMask returns EIP-55 checksummed addresses. The `cases_by_filer` TreeMap key never matches due to casing. `readCasesByFiler` fetches all recent cases and filters with `.toLowerCase()` on both sides — reliable without an on-chain migration.

**Non-blocking judgment transactions**
`request_judgment` triggers LLM execution across validators, which takes 3–15 minutes. The frontend submits the tx, returns the hash immediately, and polls `readCase()` every 15 seconds until the status becomes `DECIDED` or `FINAL`. The deliberating UI keeps users informed throughout without blocking.

**Precedent context**
Before each judgment, the contract scans up to 3 prior decided cases of the same type and injects their outcome, confidence, and reasoning summary into the prompt. Later cases are therefore contextually consistent with earlier ones of the same category.

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
