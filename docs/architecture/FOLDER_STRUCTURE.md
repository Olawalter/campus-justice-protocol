# Campus Justice Protocol — Production Folder Structure
# Phase 1 — Architecture Design

```
campus-justice-protocol/
│
├── frontend/                          # Next.js 14 App
│   ├── src/
│   │   ├── app/                       # App Router
│   │   │   ├── (landing)/             # Public landing page
│   │   │   │   └── page.tsx
│   │   │   ├── (auth)/                # Auth routes (no layout chrome)
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── register/
│   │   │   │       └── page.tsx
│   │   │   ├── (student)/             # Student portal
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── cases/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── file-dispute/
│   │   │   │       └── page.tsx
│   │   │   ├── (institution)/         # Institution portal
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── cases/
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx
│   │   │   ├── (shared)/              # Shared authenticated routes
│   │   │   │   ├── precedents/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── transparency/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── judgment/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── notifications/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   ├── (admin)/               # Admin portal
│   │   │   │   ├── layout.tsx
│   │   │   │   └── portal/
│   │   │   │       └── page.tsx
│   │   │   ├── api/                   # API routes
│   │   │   │   └── webhook/
│   │   │   │       └── route.ts
│   │   │   ├── layout.tsx             # Root layout
│   │   │   ├── globals.css
│   │   │   └── page.tsx               # Root redirect
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui base components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   └── tooltip.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── ThemeToggle.tsx
│   │   │   │   └── PageWrapper.tsx
│   │   │   ├── landing/
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── FeaturesSection.tsx
│   │   │   │   ├── HowItWorksSection.tsx
│   │   │   │   ├── StatsSection.tsx
│   │   │   │   └── CTASection.tsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── WalletConnectButton.tsx
│   │   │   ├── cases/
│   │   │   │   ├── CaseCard.tsx
│   │   │   │   ├── CaseList.tsx
│   │   │   │   ├── CaseStatusBadge.tsx
│   │   │   │   ├── CaseTimeline.tsx
│   │   │   │   ├── CaseFilingForm.tsx
│   │   │   │   └── CaseDetails.tsx
│   │   │   ├── evidence/
│   │   │   │   ├── EvidenceUploader.tsx
│   │   │   │   ├── EvidenceList.tsx
│   │   │   │   ├── EvidenceHashDisplay.tsx
│   │   │   │   └── EvidenceVerifier.tsx
│   │   │   ├── judgment/
│   │   │   │   ├── JudgmentCard.tsx
│   │   │   │   ├── JudgmentViewer.tsx
│   │   │   │   ├── ConfidenceScore.tsx
│   │   │   │   └── AppealForm.tsx
│   │   │   ├── deliberation/
│   │   │   │   ├── DeliberationGraph.tsx
│   │   │   │   ├── ValidatorNodes.tsx
│   │   │   │   └── ConsensusIndicator.tsx
│   │   │   ├── precedent/
│   │   │   │   ├── PrecedentCard.tsx
│   │   │   │   ├── PrecedentSearch.tsx
│   │   │   │   └── PrecedentFilters.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── MetricCard.tsx
│   │   │   │   ├── RecentCases.tsx
│   │   │   │   ├── ReputationScore.tsx
│   │   │   │   └── ActivityFeed.tsx
│   │   │   ├── animations/
│   │   │   │   ├── JusticeScale.tsx
│   │   │   │   ├── ConsensusAnimation.tsx
│   │   │   │   ├── CaseSubmissionFlow.tsx
│   │   │   │   ├── JudgmentReveal.tsx
│   │   │   │   └── StaggeredReveal.tsx
│   │   │   ├── charts/
│   │   │   │   ├── DisputeTypeChart.tsx
│   │   │   │   ├── ResolutionRateChart.tsx
│   │   │   │   └── InstitutionMetricsChart.tsx
│   │   │   └── wallet/
│   │   │       ├── WalletProvider.tsx
│   │   │       ├── ConnectModal.tsx
│   │   │       └── WalletStatus.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useWallet.ts
│   │   │   ├── useCases.ts
│   │   │   ├── useCase.ts
│   │   │   ├── useEvidence.ts
│   │   │   ├── useJudgment.ts
│   │   │   ├── usePrecedents.ts
│   │   │   ├── useNotifications.ts
│   │   │   ├── useReputation.ts
│   │   │   └── useTheme.ts
│   │   │
│   │   ├── services/
│   │   │   ├── firebase/
│   │   │   │   ├── auth.ts            # Firebase auth operations
│   │   │   │   ├── firestore.ts       # Firestore CRUD
│   │   │   │   ├── storage.ts         # File upload/download
│   │   │   │   └── messaging.ts       # Push notifications
│   │   │   ├── genlayer/
│   │   │   │   ├── client.ts          # GenLayer JSON-RPC client
│   │   │   │   ├── contract.ts        # Contract call wrappers
│   │   │   │   └── types.ts           # Contract return types
│   │   │   ├── wallet/
│   │   │   │   ├── connector.ts       # wagmi connector setup
│   │   │   │   └── signer.ts          # Signing utilities
│   │   │   ├── evidence/
│   │   │   │   ├── hasher.ts          # SHA-256 client-side hashing
│   │   │   │   └── uploader.ts        # Upload + hash flow
│   │   │   └── notifications/
│   │   │       └── fcm.ts             # FCM token management
│   │   │
│   │   ├── store/
│   │   │   ├── index.ts               # Zustand store root
│   │   │   └── slices/
│   │   │       ├── authSlice.ts
│   │   │       ├── caseSlice.ts
│   │   │       ├── uiSlice.ts
│   │   │       └── walletSlice.ts
│   │   │
│   │   ├── types/
│   │   │   ├── case.ts                # Case, Evidence, Judgment types
│   │   │   ├── user.ts                # User, Role types
│   │   │   ├── contract.ts            # GenLayer contract types
│   │   │   ├── firebase.ts            # Firestore document types
│   │   │   └── index.ts               # Re-exports
│   │   │
│   │   ├── utils/
│   │   │   ├── hash.ts                # SHA-256 hashing
│   │   │   ├── format.ts              # Date, address, status formatters
│   │   │   ├── validation.ts          # Form validators
│   │   │   └── cn.ts                  # TailwindCSS class merger
│   │   │
│   │   ├── config/
│   │   │   ├── firebase.ts            # Firebase app init
│   │   │   ├── wagmi.ts               # wagmi config
│   │   │   └── constants.ts           # App-wide constants
│   │   │
│   │   └── lib/
│   │       └── fonts.ts               # Next/font declarations
│   │
│   ├── public/
│   │   ├── fonts/
│   │   └── images/
│   ├── .env.local                     # Local environment variables
│   ├── .env.example                   # Environment variable template
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── components.json                # shadcn/ui config
│   └── package.json
│
├── contracts/
│   ├── src/
│   │   └── campus_justice_protocol.py # Main Intelligent Contract
│   ├── tests/
│   │   └── test_campus_justice.py     # Contract test suite
│   ├── scripts/
│   │   └── deploy.py                  # Deployment script
│   └── abi/
│       └── campus_justice_protocol.json
│
├── firebase/
│   ├── rules/
│   │   ├── firestore.rules
│   │   └── storage.rules
│   ├── indexes/
│   │   └── firestore.indexes.json
│   └── functions/
│       └── src/
│           ├── index.ts               # Functions entry
│           ├── onCaseUpdate.ts        # Trigger: notify on case update
│           └── onJudgment.ts          # Trigger: notify on judgment
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md            # This file
│   │   └── FOLDER_STRUCTURE.md
│   ├── contracts/
│   │   └── CONTRACT_SPEC.md
│   ├── api/
│   │   └── API_REFERENCE.md
│   └── deployment/
│       └── DEPLOYMENT_GUIDE.md
│
├── scripts/
│   └── setup.py                       # Project bootstrap script
│
└── README.md
```
