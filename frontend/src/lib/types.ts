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

export interface Judgment {
  outcome: Outcome
  reasoning: string
  key_findings: string[]
  recommendation: string
  confidence: number
  audit_trail?: string[]
  decided_at: string
}

export interface Appeal {
  appellant: string
  grounds: string
}

export interface Case {
  case_id: string
  filer: string
  case_type: CaseType
  title: string
  description: string
  evidence_refs: string
  matric_number: string
  department: string
  status: CaseStatus
  response_text: string
  respondent: string
  judgment: Judgment | null
  appeal: Appeal | null
  final_judgment: Judgment | null
  filed_at: string
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
