/**
 * verifyJudgmentFinality — single authoritative helper for every judgment
 * display path in the app.
 *
 * GenLayer Builder requirement: a judgment MUST NOT be displayed unless ALL
 * of the following hold:
 *   1. A receipt exists and its statusName is explicitly 'FINALIZED'.
 *   2. The execution result is SUCCESS / FINISHED_WITH_RETURN.
 *   3. The receipt's to_address matches the deployed contract.
 *   4. The decoded calldata matches the stored functionName and caseId.
 *   5. A post-finalization contract read confirms the case is DECIDED or FINAL
 *      and the relevant judgment field is populated.
 *
 * On ANY failure this function returns { ok: false }. The caller must show
 * "Finalization Pending" or "Unable to Verify Finality" and MUST NOT render
 * judgment content.
 */

import { createClient, abi } from 'genlayer-js'
import { TransactionStatus } from 'genlayer-js/types'
import { readCase, getChain } from '@/lib/genlayer'
import { CONTRACT_ADDRESS } from '@/lib/constants'
import type { Case } from '@/lib/types'

export interface FinalityMeta {
  /** The tx hash for request_judgment or request_appeal_judgment. */
  hash: string
  /** 'request_judgment' or 'request_appeal_judgment' */
  functionName: string
  /** e.g. 'CJP-000002' */
  caseId: string
}

export type FinalityResult =
  | { ok: true; caseData: Case }
  | { ok: false; reason: string }

export async function verifyJudgmentFinality(
  meta: FinalityMeta,
  signal?: AbortSignal,
): Promise<FinalityResult> {
  const aborted = () => signal?.aborted ?? false

  // ── Step 1: fetch receipt with all raw fields intact ──────────────────────
  // fullTransaction: true bypasses simplifyTransactionReceipt, which would
  // strip JS Map values and omit studionet-specific fields like
  // consensus_data.leader_receipt[*].execution_result and data.calldata.base64.
  let receipt: Record<string, unknown>
  try {
    const client = createClient({ chain: getChain() })
    receipt = await (client as unknown as {
      waitForTransactionReceipt: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
    }).waitForTransactionReceipt({
      hash: meta.hash,
      status: TransactionStatus.FINALIZED,
      retries: 120,
      interval: 5000,
      fullTransaction: true,
    })
  } catch {
    return { ok: false, reason: 'receipt_fetch_failed' }
  }

  if (aborted()) return { ok: false, reason: 'aborted' }

  // ── Step 2: receipt must exist and be explicitly FINALIZED ────────────────
  // statusName is set by decodeLocalnetTransaction (genlayer-js processing layer).
  // Fallback to raw 'status' field for environments where that processing hasn't
  // run (e.g. when the receipt is used before decodeLocalnetTransaction completes).
  const statusName = (receipt.statusName ?? receipt.status_name ?? receipt.status ?? '') as string
  if (statusName !== 'FINALIZED') {
    return { ok: false, reason: `status_not_finalized:${statusName}` }
  }

  // ── Step 3: execution must have succeeded ─────────────────────────────────
  // Studionet: execution_result lives in consensus_data.leader_receipt[0].
  // Testnet/mainnet: txExecutionResultName at top level.
  // Missing field = fail closed.
  const leaderReceipts = (receipt.consensus_data as Record<string, unknown> | undefined)?.leader_receipt
  const leaderReceipt = (Array.isArray(leaderReceipts) ? leaderReceipts[0] : leaderReceipts) as
    Record<string, unknown> | undefined
  const execResult = (
    (receipt as Record<string, unknown>).txExecutionResultName ??
    leaderReceipt?.execution_result ??
    ''
  ) as string
  if (execResult !== 'SUCCESS' && execResult !== 'FINISHED_WITH_RETURN') {
    return { ok: false, reason: `execution_not_success:${execResult}` }
  }

  // ── Step 4a: contract address must match ──────────────────────────────────
  // to_address is preserved by studionet; recipient is the fallback.
  // The 'to' field is excluded by FIELDS_TO_REMOVE in simplifyTransactionReceipt,
  // which is why we use to_address / recipient (both present on studionet).
  const toAddr = (
    ((receipt as Record<string, unknown>).to_address ??
    (receipt as Record<string, unknown>).recipient ??
    '') as string
  ).toLowerCase()
  if (!toAddr || toAddr !== CONTRACT_ADDRESS.toLowerCase()) {
    return { ok: false, reason: `address_mismatch:${toAddr}` }
  }

  // ── Step 4b: calldata must decode and match stored meta ───────────────────
  // Studionet path (fullTransaction=true): decodeLocalnetTransaction converts
  //   data.calldata from a raw base64 string → { base64, readable } object.
  //   calldata.toString() produces trailing commas in arrays ("CJP-000001,")
  //   which is NOT valid JSON — we must decode the raw bytes with
  //   abi.calldata.decode → Map, then use Map.get().
  // Testnet/mainnet path: txDataDecoded.callData is a Map from decodeTransaction.
  let callDataMap: Map<string, unknown> | null = null
  const calldataRaw = (
    (receipt as Record<string, unknown>).data as Record<string, unknown> | undefined
  )?.calldata
  // decodeLocalnetTransaction converts calldata to { base64, readable } object,
  // but if that processing hasn't run the raw API returns calldata as a plain
  // base64 string directly — handle both forms.
  const b64str = (
    typeof calldataRaw === 'string'
      ? calldataRaw
      : (calldataRaw as Record<string, unknown> | undefined)?.base64 ?? ''
  ) as string

  if (b64str) {
    try {
      const bytes = Uint8Array.from(atob(b64str), c => c.charCodeAt(0))
      const decoded = abi.calldata.decode(bytes)
      if (decoded instanceof Map) callDataMap = decoded
    } catch {
      return { ok: false, reason: 'calldata_decode_error' }
    }
  } else {
    const m = (receipt as Record<string, unknown>).txDataDecoded as
      Record<string, unknown> | undefined
    const cd = m?.callData
    if (cd instanceof Map) callDataMap = cd
  }

  if (!callDataMap) return { ok: false, reason: 'calldata_missing' }

  const fn = callDataMap.get('method')
  if (typeof fn !== 'string' || fn !== meta.functionName) {
    return { ok: false, reason: `method_mismatch:${String(fn)}` }
  }
  const args = callDataMap.get('args')
  if (!Array.isArray(args) || !args.length || String(args[0]) !== meta.caseId) {
    return { ok: false, reason: `args_mismatch` }
  }

  if (aborted()) return { ok: false, reason: 'aborted' }

  // ── Step 5: post-finalization contract read ───────────────────────────────
  // Read the contract AFTER all receipt checks pass. This is a fresh read of
  // the finalised state — not the accepted (optimistic) state that was used
  // to trigger the verification.
  let fresh: Case | null = null
  try {
    fresh = await readCase(meta.caseId)
  } catch {
    return { ok: false, reason: 'contract_read_failed' }
  }

  if (aborted()) return { ok: false, reason: 'aborted' }

  if (!fresh) return { ok: false, reason: 'case_not_found' }

  // Contract must confirm the case has reached a terminal decided state.
  if (!['DECIDED', 'FINAL'].includes(fresh.status)) {
    return { ok: false, reason: `contract_status_not_final:${fresh.status}` }
  }

  // The relevant judgment field must be populated in the freshly-read state.
  if (meta.functionName === 'request_judgment' && !fresh.judgment) {
    return { ok: false, reason: 'judgment_absent_in_contract' }
  }
  if (meta.functionName === 'request_appeal_judgment' && !fresh.final_judgment) {
    return { ok: false, reason: 'final_judgment_absent_in_contract' }
  }

  return { ok: true, caseData: fresh }
}
