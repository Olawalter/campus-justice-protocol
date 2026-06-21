# Campus Justice Protocol (CJP)

A decentralized AI-powered academic dispute resolution platform built on [GenLayer](https://genlayer.com). CJP provides students and educational institutions with a transparent, fair, and tamper-proof system for resolving academic disputes through AI-assisted deliberation and blockchain consensus.

## Problem Statement

Academic disputes — grade appeals, disciplinary hearings, examination irregularities — are often resolved behind closed doors with little transparency. Students lack recourse, and institutions face reputational risk from opaque processes. CJP solves this by putting dispute resolution on-chain, with AI validators that reason over evidence and deliver consensus-backed judgments.

## How It Works

1. **Student files a dispute** — selects the institution, dispute type (grade appeal, disciplinary, exam irregularity, etc.), provides evidence files, and submits on-chain via GenLayer.
2. **Admin verifies** — an admin reviews the submission for completeness and verifies the case.
3. **Institution responds** — the named institution receives a notification and submits their formal response with supporting documents.
4. **AI deliberation** — GenLayer's Intelligent Contract triggers AI evaluation. Multiple validators independently analyze the evidence, student complaint, and institutional response to reach a consensus judgment.
5. **Judgment issued** — the verdict includes an outcome (in favor of student, institution, or partial), confidence score, detailed reasoning, and evidence summary.
6. **Appeal (optional)** — either party can appeal. A fresh round of AI deliberation re-evaluates all evidence.

All case data is anchored on-chain. Firestore serves as an off-chain metadata cache for fast queries, and Firebase Storage holds evidence files.

## Features

- **Multi-role dashboard** — separate interfaces for Students, Institutions, and Admins
- **On-chain case management** — file, verify, respond, evaluate, and appeal cases through GenLayer Intelligent Contracts
- **AI-powered deliberation** — non-deterministic consensus across multiple validators
- **Evidence vault** — upload and hash evidence files; hashes stored on-chain for integrity
- **Real-time notifications** — in-app alerts for case status changes
- **Case timeline** — visual progress tracker showing each stage of a dispute
- **Judgment reveal** — animated verdict display with confidence scores and reasoning
- **Precedent system** — reference past rulings to inform future decisions
- **Institution reputation** — track institutional response rates and outcomes
- **Dark mode** — full dark/light theme support
- **Responsive design** — works on desktop and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Radix UI, Framer Motion |
| State Management | Zustand (persisted) |
| Authentication | Firebase Auth (email/password + wallet provisioning) |
| Database | Cloud Firestore (off-chain metadata cache) |
| File Storage | Firebase Storage |
| Smart Contract | GenLayer Intelligent Contract (Python) |
| SDK | genlayer-js |
| Deployment | Vercel (frontend), GenLayer StudioNet (contract) |

## Project Structure

```
campus-justice-protocol/
├── frontend/                  # Next.js application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── student/       # Student dashboard, case filing, case detail
│   │   │   ├── institution/   # Institution dashboard, case response
│   │   │   ├── admin/         # Admin dashboard, case verification
│   │   │   ├── login/         # Authentication
│   │   │   ├── register/      # User registration
│   │   │   ├── transparency/  # Public transparency dashboard
│   │   │   └── precedents/    # Precedent case browser
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui primitives
│   │   │   ├── cases/         # Case-related components
│   │   │   ├── layout/        # Page wrappers, navigation, auth guards
│   │   │   └── animations/    # Judgment reveal, loading states
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # Firebase & GenLayer service layers
│   │   ├── store/             # Zustand global state
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Formatting & helper utilities
│   └── public/                # Static assets
├── contracts/                 # GenLayer Intelligent Contract (Python)
├── firebase/                  # Firestore security rules & indexes
└── docs/                      # Architecture & contract documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Firebase project with Auth, Firestore, and Storage enabled
- A GenLayer StudioNet account (for contract deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/Olawalter/campus-justice-protocol.git
cd campus-justice-protocol

# Install frontend dependencies
cd frontend
npm install
```

### Environment Variables

Create `frontend/.env.local` with your Firebase and GenLayer configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
```

### Running Locally

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploying Firestore Rules

```bash
firebase login
firebase deploy --only firestore:rules --project your-project-id
```

## User Roles

| Role | Capabilities |
|---|---|
| **Student** | File disputes, upload evidence, view case progress, appeal judgments |
| **Institution** | View disputes filed against them, submit formal responses with documents |
| **Admin** | Verify cases, notify institutions, trigger AI evaluation, manage all cases |

## GenLayer Intelligent Contract

The core dispute resolution logic lives in a GenLayer Intelligent Contract written in Python. Key contract methods:

- `create_case()` — registers a new dispute on-chain
- `verify_case()` — admin marks a case as verified
- `notify_institution()` — transitions case to awaiting institutional response
- `submit_response()` — institution submits their response
- `evaluate_case()` — triggers AI deliberation across validators
- `file_appeal()` — initiates appeal process
- `evaluate_appeal()` — re-evaluates with fresh validator consensus

The contract uses GenLayer's non-deterministic execution model — multiple AI validators independently analyze the case and reach consensus on the judgment.

## Deployment

### Frontend (Vercel)

The frontend deploys to Vercel with zero configuration:

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Add environment variables in the Vercel dashboard
4. Deploy

### Smart Contract (GenLayer StudioNet)

Deploy the Intelligent Contract via GenLayer Studio at [studio.genlayer.com](https://studio.genlayer.com).

## License

MIT

## Author

**Walter Olaolu** — [GitHub](https://github.com/Olawalter)
