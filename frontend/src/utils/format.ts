import { CaseStatus, JudgmentOutcome, DisputeType } from '@/types'

export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatDate(timestamp: number): string {
  if (!timestamp || timestamp <= 0) return '—'
  // Auto-detect seconds vs milliseconds: if > year 2100 in seconds, it's milliseconds
  const ms = timestamp > 4_000_000_000 ? timestamp : timestamp * 1000
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms))
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000))
}

export function formatCaseStatus(status: CaseStatus): string {
  const labels: Record<CaseStatus, string> = {
    SUBMITTED: 'Submitted',
    VERIFIED: 'Verified',
    INSTITUTION_NOTIFIED: 'Institution Notified',
    RESPONDED: 'Responded',
    DELIBERATING: 'Deliberating',
    JUDGMENT_ISSUED: 'Judgment Issued',
    APPEALED: 'Appealed',
    FINAL_JUDGMENT: 'Final Judgment',
    CLOSED: 'Closed',
  }
  return labels[status] ?? status
}

export function formatDisputeType(type: DisputeType): string {
  const labels: Record<DisputeType, string> = {
    GPA_MISCALCULATION: 'GPA Miscalculation',
    DEGREE_CLASSIFICATION: 'Degree Classification',
    MISSING_GRADE: 'Missing Grade',
    TRANSCRIPT_DISPUTE: 'Transcript Dispute',
    SCHOLARSHIP_DISPUTE: 'Scholarship Dispute',
    WRONGFUL_SUSPENSION: 'Wrongful Suspension',
    EXPULSION_APPEAL: 'Expulsion Appeal',
    FEE_DISPUTE: 'Fee Dispute',
    HOSTEL_ALLOCATION: 'Hostel Allocation',
    THESIS_GRADING: 'Thesis/Project Grading',
    SEXUAL_HARASSMENT: 'Sexual Harassment',
    OTHER: 'Other',
  }
  return labels[type] ?? type
}

export function formatOutcome(outcome: JudgmentOutcome): string {
  const labels: Record<JudgmentOutcome, string> = {
    UPHELD: 'Appeal Upheld',
    REJECTED: 'Appeal Rejected',
    FURTHER_REVIEW: 'Further Review Required',
    SETTLEMENT_RECOMMENDED: 'Settlement Recommended',
  }
  return labels[outcome] ?? outcome
}

export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`
}
