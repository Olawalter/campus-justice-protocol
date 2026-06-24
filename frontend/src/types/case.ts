export type DisputeType =
  | 'GPA_MISCALCULATION'
  | 'DEGREE_CLASSIFICATION'
  | 'MISSING_GRADE'
  | 'TRANSCRIPT_DISPUTE'
  | 'SCHOLARSHIP_DISPUTE'
  | 'WRONGFUL_SUSPENSION'
  | 'EXPULSION_APPEAL'
  | 'FEE_DISPUTE'
  | 'HOSTEL_ALLOCATION'
  | 'THESIS_GRADING'
  | 'SEXUAL_HARASSMENT'
  | 'OTHER'

export type CaseStatus =
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'INSTITUTION_NOTIFIED'
  | 'RESPONDED'
  | 'DELIBERATING'
  | 'JUDGMENT_ISSUED'
  | 'APPEALED'
  | 'FINAL_JUDGMENT'
  | 'CLOSED'

export type JudgmentOutcome =
  | 'UPHELD'
  | 'REJECTED'
  | 'FURTHER_REVIEW'
  | 'SETTLEMENT_RECOMMENDED'

export interface Evidence {
  hash: string
  uploader: string
  timestamp: number
  description: string
  fileUrl?: string // Firebase Storage URL — off-chain
}

export interface ValidatorConsensus {
  totalValidators: number
  agreeingValidators: number
  consensusReached: boolean
  rounds: number
}

export interface Judgment {
  outcome: JudgmentOutcome
  reasoning: string
  evidenceSummary: string
  confidenceScore: number
  validatorConsensus: ValidatorConsensus
  issuedAt: number
}

export interface Appeal {
  appellant: string
  grounds: string
  filedAt: number
  outcome?: Judgment
}

export interface Case {
  caseId: string
  filer: string
  institution: string
  disputeType: DisputeType
  description: string
  status: CaseStatus
  createdAt: number
  updatedAt: number
  evidenceHashes: string[]
  responseHashes: string[]
  judgment?: Judgment
  appeal?: Appeal
  precedentRefs: string[]
  // Off-chain metadata (Firestore)
  matricNumber?: string
  department?: string
  studentName?: string
  institutionName?: string
}

export interface CaseFilingInput {
  institution: string
  institutionName: string
  institutionEmail: string
  department: string
  matricNumber: string
  disputeType: DisputeType
  description: string
  evidenceFiles: File[]
}
