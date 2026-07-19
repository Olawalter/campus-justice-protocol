import type { CaseType } from './types'
import { getAddress } from 'viem'

const _raw = (process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ?? '').trim()
export const CONTRACT_ADDRESS = (_raw ? getAddress(_raw) : '0x0000000000000000000000000000000000000000') as `0x${string}`
export const RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? 'https://studio.genlayer.com/api'
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || 61999)

export const CASE_TYPE_META: Record<CaseType, { label: string; icon: string; description: string }> = {
  ACADEMIC_APPEAL: {
    label: 'Academic Grade Appeal',
    icon: '🎓',
    description: 'Challenge a grade, GPA calculation, or degree classification',
  },
  EXAM_MISCONDUCT: {
    label: 'Examination Misconduct',
    icon: '📋',
    description: 'Dispute an exam misconduct allegation or invigilation error',
  },
  STUDENT_COMPLAINT: {
    label: 'Student Complaint',
    icon: '📢',
    description: 'General complaint about institutional conduct or policy',
  },
  ELECTION_DISPUTE: {
    label: 'Election Dispute',
    icon: '🗳️',
    description: 'Challenge the outcome or process of a student election',
  },
  SCHOLARSHIP: {
    label: 'Scholarship Decision',
    icon: '💰',
    description: 'Appeal a scholarship award, revocation, or eligibility decision',
  },
  HOSTEL: {
    label: 'Hostel Allocation',
    icon: '🏠',
    description: 'Dispute a hostel room assignment or accommodation decision',
  },
  RESEARCH_FUNDING: {
    label: 'Research Funding',
    icon: '🔬',
    description: 'Appeal a research grant, lab access, or funding decision',
  },
}

export const STATUS_META: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: 'Submitted', color: '#6366F1' },
  RESPONDED: { label: 'Responded', color: '#8B5CF6' },
  DELIBERATING: { label: 'Deliberating…', color: '#F59E0B' },
  DECIDED: { label: 'Decided', color: '#10B981' },
  APPEALED: { label: 'Appealed', color: '#F97316' },
  FINAL: { label: 'Final Decision', color: '#06B6D4' },
}

export const OUTCOME_META: Record<string, { label: string; color: string; bg: string }> = {
  UPHELD: { label: 'Upheld', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  DISMISSED: { label: 'Dismissed', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  PARTIAL: { label: 'Partial', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  INCONCLUSIVE: { label: 'Inconclusive', color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' },
}

export const GENLAYER_NETWORK = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: CHAIN_ID === 61999 ? 'GenLayer Studionet' : 'GenLayer Testnet Asimov',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: [RPC_URL],
}
