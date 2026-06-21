import { createClient, createAccount, chains } from 'genlayer-js'
import { GENLAYER_RPC_URL, CONTRACT_ADDRESS } from '@/config/constants'
import { ContractReadParams, TransactionResult } from '@/types'

// ── Studionet chain config ─────────────────────────────────────────────────────
// Override the RPC URL if a custom one is set in env
const studioChain = {
  ...chains.studionet,
  rpcUrls: {
    ...chains.studionet.rpcUrls,
    default: {
      http: [GENLAYER_RPC_URL],
    },
  },
}

// ── Read-only client (no account needed for view calls) ───────────────────────
const readClient = createClient({ chain: studioChain })

// ── View method helper ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CalldataArgs = any[]

export async function callView(method: string, args: CalldataArgs): Promise<unknown> {
  return readClient.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: method,
    args,
  })
}

// ── Write helper: requires a funded private key for the caller ────────────────
export async function callWrite(
  privateKey: `0x${string}`,
  method: string,
  args: CalldataArgs
): Promise<TransactionResult> {
  try {
    const account = createAccount(privateKey)
    const client = createClient({ chain: studioChain, account })

    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName: method,
      args,
      value: BigInt(0),
    })

    // Wait for transaction to be finalized on-chain
    const receipt = await client.waitForTransactionReceipt({
      hash,
      retries: 120,
      interval: 5000,
    })

    // Check for contract-level errors and extract return value
    let returnValue: string | undefined
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tx = await client.getTransaction({ hash }) as any
      const leaderReceipt = tx?.consensus_data?.leader_receipt
      if (leaderReceipt?.exit_code === 1) {
        const stderr = leaderReceipt.stderr || 'Contract execution failed'
        return { hash: String(hash), success: false, error: stderr }
      }
      // Extract the contract's return value (e.g. case_id from create_case)
      const raw = leaderReceipt?.result ?? leaderReceipt?.stdout
      if (raw != null) {
        returnValue = typeof raw === 'string' ? raw.replace(/^"|"$/g, '') : String(raw)
      }
    } catch {
      // If we can't fetch detailed tx data, fall through with receipt status
    }

    if (receipt && typeof receipt === 'object' && 'status' in receipt && receipt.status === 0) {
      return { hash: String(hash), success: false, error: 'Transaction reverted on-chain' }
    }

    return { hash: String(hash), success: true, returnValue }
  } catch (error) {
    return {
      hash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ── Legacy compatibility shim (for existing contract.ts callers) ──────────────
export const genLayerClient = {
  readContract: ({ method, args }: ContractReadParams) => callView(method, args),
  writeContract: async ({
    method,
    args,
    from: _from, // eslint-disable-line @typescript-eslint/no-unused-vars
    privateKey,
  }: {
    method: string
    args: unknown[]
    from: string
    privateKey?: `0x${string}`
  }): Promise<TransactionResult> => {
    if (!privateKey) {
      return { hash: '', success: false, error: 'No private key available — wallet not provisioned.' }
    }
    return callWrite(privateKey, method, args)
  },
}
