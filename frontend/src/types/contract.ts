// GenLayer contract interaction types

export interface ContractCallParams {
  method: string
  args: unknown[]
  from: string
  privateKey?: `0x${string}`
}

export interface ContractReadParams {
  method: string
  args: unknown[]
}

export interface TransactionResult {
  hash: string
  success: boolean
  error?: string
  returnValue?: string
}

export interface GenLayerCase {
  case_id: string
  filer: string
  institution: string
  dispute_type: string
  description: string
  status: string
  created_at: number
  updated_at: number
  evidence_hashes: string[]
  response_hashes: string[]
  judgment: GenLayerJudgment | null
  appeal: GenLayerAppeal | null
  precedent_refs: string[]
}

export interface GenLayerJudgment {
  outcome: string
  reasoning: string
  evidence_summary: string
  confidence_score: number
  validator_consensus: {
    total_validators: number
    agreeing_validators: number
    consensus_reached: boolean
    rounds: number
  }
  issued_at: number
}

export interface GenLayerAppeal {
  appellant: string
  grounds: string
  filed_at: number
  outcome: GenLayerJudgment | null
}

export interface TransparencyStats {
  total_cases: number
  resolved_cases: number
  pending_cases: number
  deliberating_cases: number
  appeal_rate: number
  upheld_rate: number
  rejected_rate: number
  institution_count: number
  verified_institutions: number
  precedent_count: number
}
