# Campus Justice Protocol

> A decentralized AI arbitration system for university disputes — powered by GenLayer intelligent contracts and Optimistic Democracy.

**Live:** [campusjp.vercel.app](https://campusjp.vercel.app) · **Chain:** GenLayer Studionet (61999) · **Stack:** Next.js 15 · TypeScript · Tailwind CSS 4 · genlayer-js 1.1.8

---

## What is this?

Universities handle hundreds of disputes every year — grade appeals, exam misconduct, scholarship decisions, hostel allocations — and most of them go through slow, opaque, human-only processes with no audit trail.

Campus Justice Protocol puts the arbitration on-chain. When a student files a case, GenLayer validators independently run an AI model, reach consensus via Optimistic Democracy, and write a binding judgment directly to the contract. No central authority. No black box. Every reasoning step, key finding, and confidence score is permanently on-chain and publicly verifiable.

---

## Case Types

| Type | Description |
|---|---|
| 🎓 Academic Grade Appeal | Dispute over grades, marking, or assessment outcomes |
| 📋 Exam Misconduct | Allegations of cheating, plagiarism, or invigilation failures |
| 📢 Student Complaint | General complaints against staff or university policy |
| 🗳️ Election Dispute | Student union or faculty election irregularities |
| 🏆 Scholarship Decision | Appeals on scholarship award or revocation |
| 🏠 Hostel Allocation | Disputes over room assignments or hostel policy |
| 🔬 Research Funding | Disputes over grant allocation or research support |

---

## How It Works

```
Student files case  →  Evidence refs submitted on-chain
        ↓
Institution responds (optional)
        ↓
Student requests AI judgment
        ↓
GenLayer validators independently run LLM (Optimistic Democracy)
        ↓
Consensus reached → judgment written to contract
        ↓
Student can appeal → Senior arbitrator re-evaluates
        ↓
Final judgment — immutable, publicly auditable
```

Each judgment includes:
- **Outcome** — UPHELD / DISMISSED / PARTIAL / INCONCLUSIVE
- **Reasoning** — Thorough analysis citing specific facts
- **Key Findings** — 3+ specific findings from the case
- **Recommendation** — Actionable next step
- **Confidence Score** — 0–100% based on evidence strength
- **Validator Consensus** — How many of 5 validators agreed

---

## Tech Stack

### Frontend
| Tool | Version | Role |
|---|---|---|
| Next.js | 15 (App Router, Turbopack) | Framework |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 (CSS-first config) | Styling |
| genlayer-js | 1.1.8 | GenLayer client |
| ethers / viem | v6 | EVM utilities |

### Smart Contract
| Tool | Role |
|---|---|
| Python (GenLayer) | Intelligent contract language |
| `gl.nondet.exec_prompt` | LLM calls inside validators |
| `gl.eq_principle.prompt_non_comparative` | Single-validator consensus execution |
| GenLayer Studionet | Chain (ID: 61999) |

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
│   │   │   ├── cases/                   # Public case feed + detail
│   │   │   ├── my-cases/                # Wallet-linked case dashboard
│   │   │   └── file/                    # 3-step case filing form
│   │   ├── components/
│   │   │   ├── cases/                   # CaseCard, FileCaseForm, JudgmentPanel
│   │   │   └── ui/                      # StatusBadge, ValidatorRing, Navbar
│   │   ├── contexts/
│   │   │   └── WalletContext.tsx        # Wallet state + all write operations
│   │   └── lib/
│   │       ├── genlayer.ts              # Read client + all contract reads
│   │       ├── constants.ts             # Contract address, chain ID, case metadata
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
- GenLayer Studionet account with GEN tokens ([studio.genlayer.com](https://studio.genlayer.com))

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
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0xb2dF89bfCa8318D32e154cd9093bA6a8431a3253
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_APP_URL=https://campusjp.vercel.app
```

### 3. Run the dev server

```bash
npm run dev
# → http://localhost:3001
```

### 4. Connect your wallet

Open the app, click **Connect Wallet** — MetaMask will prompt you to add GenLayer Studionet automatically if not already configured.

---

## Deploying the Contract

The intelligent contract lives in `contracts/src/campus_justice_protocol.py`.

1. Go to [GenLayer Studio](https://studio.genlayer.com)
2. Open or paste the contract file
3. Click **Deploy**
4. Copy the deployed contract address
5. Update `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS` in `.env.local` (and Vercel env vars for production)

---

## Contract Overview

```python
class CampusJusticeProtocol(gl.Contract):
    cases: TreeMap[str, str]           # case_id → JSON
    case_ids: DynArray[str]            # ordered list
    cases_by_filer: TreeMap[str, str]  # address → case IDs
    case_counter: u256
```

### Write Methods
| Method | Access | Description |
|---|---|---|
| `file_case(...)` | Public | File a new dispute case |
| `submit_response(case_id, text)` | Public | Institution submits response |
| `request_judgment(case_id)` | Filer only | Trigger AI judgment via LLM |
| `file_appeal(case_id, grounds)` | Filer only | Appeal a DECIDED case |
| `request_appeal_judgment(case_id)` | Filer only | Trigger appeal AI judgment |

### Read Methods
| Method | Returns |
|---|---|
| `get_case(case_id)` | JSON string of single case |
| `get_recent_cases(limit)` | JSON array of latest N cases |
| `get_case_count()` | Total cases filed |
| `get_stats()` | Aggregate stats (totals, outcomes, rates) |

### Case Status Flow
```
SUBMITTED → RESPONDED? → [request_judgment] → DECIDED
                                                  ↓
                                            [file_appeal]
                                                  ↓
                                           APPEALED → FINAL
```

---

## Key Design Decisions

**Why `prompt_non_comparative` instead of `prompt_comparative`?**
`prompt_comparative` requires all validators to produce byte-identical LLM outputs to reach consensus. LLMs are inherently non-deterministic — even the same prompt yields different phrasings. `prompt_non_comparative` runs one validator and applies `task`/`criteria` validation instead, making consensus reliable without sacrificing correctness.

**Why client-side address filtering for My Cases?**
GenLayer Python stores `gl.message.sender_address` as a lowercase string. MetaMask returns EIP-55 checksummed addresses. The `cases_by_filer` TreeMap key never matches due to casing. `readCasesByFiler` fetches all recent cases and filters with `.toLowerCase()` on both sides — simple and reliable without an on-chain migration.

**Why no `client.connect()`?**
genlayer-js's `connect()` internally calls `wallet_getSnaps` on the GenLayer RPC, which returns "method not found." Network switching is handled directly via `wallet_switchEthereumChain` / `wallet_addEthereumChain` (EIP-3326/EIP-3085).

**Why immediate return for judgment transactions?**
`request_judgment` triggers LLM execution across GenLayer validators, which takes 3–10 minutes. The frontend submits the tx and returns the hash immediately; the case detail page polls `readCase()` every 15 seconds until status becomes `DECIDED`, keeping the UI responsive throughout.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set **root directory** to `frontend`
4. Add environment variables matching `.env.local`
5. Deploy

---

## License

MIT © 2026 Walter Olaolu
