export const APP_NAME = 'Campus Justice Protocol'
export const APP_SHORT_NAME = 'CJP'
export const APP_DESCRIPTION =
  'AI-powered academic dispute resolution platform built on GenLayer.'

export const DISPUTE_TYPES = [
  { value: 'GPA_MISCALCULATION', label: 'GPA Miscalculation' },
  { value: 'DEGREE_CLASSIFICATION', label: 'Degree Classification Error' },
  { value: 'MISSING_GRADE', label: 'Missing Grade' },
  { value: 'TRANSCRIPT_DISPUTE', label: 'Transcript Dispute' },
  { value: 'SCHOLARSHIP_DISPUTE', label: 'Scholarship Dispute' },
  { value: 'WRONGFUL_SUSPENSION', label: 'Wrongful Suspension' },
  { value: 'EXPULSION_APPEAL', label: 'Expulsion Appeal' },
  { value: 'FEE_DISPUTE', label: 'Fee Dispute' },
  { value: 'HOSTEL_ALLOCATION', label: 'Hostel Allocation Dispute' },
  { value: 'THESIS_GRADING', label: 'Thesis/Project Grading Dispute' },
  { value: 'SEXUAL_HARASSMENT', label: 'Sexual Harassment' },
  { value: 'OTHER', label: 'Other' },
] as const

export const CASE_STATUS_ORDER = [
  'SUBMITTED',
  'VERIFIED',
  'INSTITUTION_NOTIFIED',
  'RESPONDED',
  'DELIBERATING',
  'JUDGMENT_ISSUED',
  'APPEALED',
  'FINAL_JUDGMENT',
  'CLOSED',
] as const

export const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_EVIDENCE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const GENLAYER_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? 'https://studio.genlayer.com/api'

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ?? ''
