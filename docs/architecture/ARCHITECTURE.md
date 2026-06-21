# Campus Justice Protocol — Architecture Document
# Phase 1 — Architecture Design
# Version: 1.0.0
# Date: 2026-06-19

---

## 1. System Overview

Campus Justice Protocol (CJP) is a decentralized academic dispute resolution platform.
It combines Firebase for off-chain infrastructure with GenLayer Intelligent Contracts
as the source of truth for all case data, judgments, and audit history.

The system is designed as a decentralized academic court — not a complaint portal.

---

## 2. Architecture Decisions

### 2.1 Project Name
Campus Justice Protocol (CJP)
- Contract identifier: CampusJusticeProtocol
- Firebase project ID: campus-justice-protocol
- Vercel project: campus-justice-protocol

### 2.2 Managed Backend
Firebase — scoped strictly to:
- Authentication (identity only)
- Firestore (metadata, caching, search indexes)
- Firebase Storage (evidence files — PDFs, images, documents)
- Cloud Messaging (push notifications)
- Analytics

Firebase is NOT the source of truth.
The GenLayer Intelligent Contract is the source of truth.

### 2.3 Authentication Strategy
Hybrid Authentication (Option 3)

Students:
- Email + Password via Firebase Auth
- Wallet association (MetaMask / Rainbow / Zerion)
- Every Firebase UID maps to a GenLayer wallet address

Institutions:
- Verified institutional email accounts
- Wallet association required for on-chain participation
- Admin-verified registration flow

Identity mapping:
  Firebase UID → Wallet Address → GenLayer Identity

### 2.4 Wallet Strategy
- Primary: Connect existing wallet (MetaMask, Rainbow, Zerion)
- Fallback: Generated wallet for users without one
- Library: wagmi + viem
- Provider: WalletConnect v3

### 2.5 Token
GEN (GenLayer native token)

---

## 3. On-Chain vs Off-Chain Split

### 3.1 On-Chain (GenLayer Intelligent Contract — Source of Truth)

| Data                        | Reason                          |
|-----------------------------|----------------------------------|
| Case creation & ownership   | Immutability                    |
| Evidence hashes (SHA-256)   | Integrity verification          |
| Case state transitions      | Auditability                    |
| Validator deliberations     | Consensus transparency          |
| Judgment outcomes           | Non-repudiation                 |
| Judgment reasoning          | Explainability                  |
| Appeal records              | Permanent record                |
| Reputation scores           | Trustless calculation           |
| Precedent references        | Future AI reasoning             |
| Confidence scores           | Validator output                |

### 3.2 Off-Chain (Firebase — Supporting Infrastructure)

| Data                        | Reason                          |
|-----------------------------|----------------------------------|
| Evidence files              | Storage cost & size             |
| User profiles & metadata    | Query speed                     |
| Notification state          | UX responsiveness               |
| Search indexes              | Dashboard performance           |
| Session tokens              | Auth lifecycle                  |
| Cached case summaries       | Dashboard render speed          |
| Analytics events            | Reporting                       |
| Institution verification    | Admin workflow                  |

---

## 4. System Components

### 4.1 Frontend (Next.js 14 + TypeScript)
- Framework: Next.js 14 App Router
- Language: TypeScript (strict mode)
- Styling: TailwindCSS
- Components: shadcn/ui
- Icons: Lucide
- State: Zustand
- Charts: Recharts
- Animations: Framer Motion
- Wallet: wagmi + viem + WalletConnect
- Deployment: Vercel

### 4.2 Intelligent Contract (GenLayer)
- Language: Python (GenLayer contract syntax)
- Runtime: GenLayer StudioNet
- Consensus: Non-deterministic validator consensus
- AI reasoning: Built-in LLM calls via GenLayer equivalence principle
- Token: GEN

### 4.3 Firebase Layer
- Auth: Firebase Authentication
- Database: Firestore (NoSQL)
- Storage: Firebase Storage
- Functions: Cloud Functions (Node.js 20)
- Messaging: Firebase Cloud Messaging
- Hosting: Not used (Vercel handles frontend)

---

## 5. Data Flow Architecture

### 5.1 Case Filing Flow

```
Student (UI)
  → Uploads evidence file → Firebase Storage
  → Evidence file hashed (SHA-256) client-side
  → Case metadata submitted to frontend
  → Frontend calls GenLayer contract: create_case()
      - Case ID generated on-chain
      - Evidence hash recorded on-chain
      - Case status: SUBMITTED
  → Firestore updated with case reference + Firebase Storage URL
  → Student receives case ID
```

### 5.2 Institution Response Flow

```
Institution (UI)
  → Receives notification (Firebase Cloud Messaging)
  → Uploads response evidence → Firebase Storage
  → Hashes evidence client-side
  → Calls GenLayer contract: submit_response()
      - Response hash recorded on-chain
      - Case status: RESPONDED
  → Firestore cache updated
```

### 5.3 Deliberation Flow

```
GenLayer Validators (automatic)
  → Contract calls internal LLM reasoning
  → Each validator independently evaluates:
      - Student claims
      - Institution response
      - Academic regulations (fetched via web_search)
      - Precedent cases (on-chain references)
  → Validators reach consensus
  → Judgment recorded on-chain:
      - Outcome
      - Reasoning
      - Evidence references
      - Confidence score
  → Firestore cache updated
  → Student + Institution notified
```

### 5.4 Appeal Flow

```
Losing party (UI)
  → Submits appeal with grounds
  → GenLayer contract: file_appeal()
      - Appeal recorded on-chain
      - New deliberation round triggered
  → Re-evaluation with expanded validator set
  → Final judgment recorded
```

---

## 6. Security Architecture

### 6.1 Authentication Security
- Firebase Auth tokens — short-lived JWTs (1 hour expiry)
- Wallet signature verification for all on-chain writes
- Role-based access: STUDENT | INSTITUTION | ADMIN | VALIDATOR
- Institution emails verified via domain allowlist
- No wallet operations without authenticated Firebase session

### 6.2 Evidence Security
- Client-side SHA-256 hashing before upload
- Firebase Storage security rules: owner-only read/write
- On-chain hash provides tamper detection
- Evidence files never sent to GenLayer — only hashes

### 6.3 Contract Security
- Role enforcement at contract level
- Case ownership verified before every state transition
- Cooldown periods between appeals
- Admin multi-sig for contract upgrades

### 6.4 Frontend Security
- Content Security Policy headers
- No secrets in client bundle
- Firebase config via environment variables
- Wallet private keys never touch the server

---

## 7. Deployment Architecture

### 7.1 Frontend
- Platform: Vercel
- Branch: main → production
- Preview: per-PR preview deployments
- Environment variables: Vercel dashboard
- Domain: campus-justice-protocol.vercel.app

### 7.2 Intelligent Contract
- Platform: GenLayer StudioNet
- Deployment tool: GenLayer Studio CLI
- Network: StudioNet (testnet → mainnet)

### 7.3 Firebase
- Project: campus-justice-protocol
- Region: us-central1
- Rules: Firestore + Storage rules from /firebase/rules/

---

## 8. Role System

| Role        | Capabilities                                              |
|-------------|-----------------------------------------------------------|
| STUDENT     | File disputes, upload evidence, view own cases            |
| INSTITUTION | Submit responses, upload evidence, view institution cases |
| ADMIN       | Verify institutions, manage platform, view all cases      |
| VALIDATOR   | GenLayer validator nodes — not a UI role                  |

---

## 9. Case State Machine

```
SUBMITTED
  → VERIFIED (admin or auto-verification)
    → INSTITUTION_NOTIFIED
      → RESPONDED (institution submits)
        → DELIBERATING (validators active)
          → JUDGMENT_ISSUED
            → APPEALED (optional)
              → DELIBERATING (second round)
                → FINAL_JUDGMENT
            → CLOSED
```

---

## 10. Phase Execution Plan

| Phase | Name                    | Status    |
|-------|-------------------------|-----------|
| 1     | Architecture Design     | ACTIVE    |
| 2     | UI/UX System            | PENDING   |
| 3     | GenLayer Contract Design| PENDING   |
| 4     | Firebase Integration    | PENDING   |
| 5     | Frontend Implementation | PENDING   |
| 6     | Contract Integration    | PENDING   |
| 7     | Testing                 | PENDING   |
| 8     | StudioNet Deployment    | PENDING   |
| 9     | Vercel Deployment       | PENDING   |
| 10    | Production Hardening    | PENDING   |

---

## 11. Technology Stack Summary

| Layer              | Technology                    | Version  |
|--------------------|-------------------------------|----------|
| Frontend Framework | Next.js                       | 14.x     |
| Language           | TypeScript                    | 5.x      |
| Styling            | TailwindCSS                   | 3.x      |
| Components         | shadcn/ui                     | latest   |
| State              | Zustand                       | 4.x      |
| Animations         | Framer Motion                 | 11.x     |
| Charts             | Recharts                      | 2.x      |
| Wallet             | wagmi + viem                  | 2.x      |
| Auth               | Firebase Authentication       | 10.x     |
| Database           | Firestore                     | 10.x     |
| Storage            | Firebase Storage               | 10.x     |
| Functions          | Firebase Cloud Functions      | Node 20  |
| Contract Language  | Python (GenLayer)             | 3.11+    |
| Contract Network   | GenLayer StudioNet            | latest   |
| Deployment FE      | Vercel                        | latest   |
| Icons              | Lucide React                  | latest   |
| Fonts              | Plus Jakarta Sans, Inter, Source Serif 4 | latest |
