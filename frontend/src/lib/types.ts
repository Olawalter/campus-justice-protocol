export type CaseType =
  | 'ACADEMIC_APPEAL'
  | 'EXAM_MISCONDUCT'
  | 'STUDENT_COMPLAINT'
  | 'ELECTION_DISPUTE'
  | 'SCHOLARSHIP'
  | 'HOSTEL'
  | 'RESEARCH_FUNDING'

export type CaseStatus =
  | 'SUBMITTED'
  | 'RESPONDED'
  | 'DELIBERATING'
  | 'DECIDED'
  | 'APPEALED'
  | 'FINAL'

export type Outcome = 'UPHELD' | 'DISMISSED' | 'PARTIAL' | 'INCONCLUSIVE'

export interface EvidenceItem {
  url: string
  description: string
  submitted_by: string
  submitted_at: number
}

export interface Judgment {
  outcome: Outcome
  reasoning: string
  key_findings: string[]
  recommendation: string
  confidence: number
}

export interface Appeal {
  appellant: string
  appellant_role: 'filer' | 'respondent'
  grounds: string
}

export interface Case {
  case_id: string
  filer: string
  respondent: string
  case_type: CaseType
  title: string
  description: string
  matric_number: string
  department: string
  policy_url: string
  status: CaseStatus
  created_at: number          // UTC unix seconds
  evidence_deadline: number   // UTC unix seconds
  appeal_deadline: number | null
  finalized_at: number | null
  filer_evidence: EvidenceItem[]
  respondent_evidence: EvidenceItem[]
  response_text: string
  judgment: Judgment | null
  appeal: Appeal | null
  final_judgment: Judgment | null
}

export interface Stats {
  total: number
  decided: number
  pending: number
  upheld: number
  dismissed: number
  partial: number
  appealed: number
  upheld_rate: number
}

export interface WalletState {
  address: string | null
  connected: boolean
  connecting: boolean
  error: string | null
}
