export type UserRole = 'STUDENT' | 'INSTITUTION' | 'ADMIN'

export interface UserProfile {
  uid: string
  email: string
  role: UserRole
  displayName: string
  walletAddress?: string
  walletPrivateKey?: `0x${string}`
  createdAt: number
  updatedAt: number
  // Student-specific
  matricNumber?: string
  department?: string
  institutionId?: string
  // Institution-specific
  institutionName?: string
  domain?: string
  verified?: boolean
}

export interface WalletCaller {
  address: string
  privateKey: `0x${string}`
}

export interface InstitutionProfile {
  address: string
  name: string
  domain: string
  verified: boolean
  reputationScore: number
  totalCases: number
  resolvedCases: number
  appealSuccessRate: number
  avgResolutionDays: number
}

export interface AuthState {
  user: UserProfile | null
  loading: boolean
  error: string | null
}
