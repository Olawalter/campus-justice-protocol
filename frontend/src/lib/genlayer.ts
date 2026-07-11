import { createClient } from 'genlayer-js'
import { studionet, testnetAsimov } from 'genlayer-js/chains'
import { CHAIN_ID, CONTRACT_ADDRESS, RPC_URL } from './constants'

export { CHAIN_ID, RPC_URL }
import type { Case, Stats } from './types'

export function getChain() {
  if (CHAIN_ID === 61999) return studionet
  return testnetAsimov
}

export function getReadClient() {
  return createClient({ chain: getChain() })
}

export function getNetworkName(): 'studionet' | 'testnetAsimov' {
  return CHAIN_ID === 61999 ? 'studionet' : 'testnetAsimov'
}

// ── Reads ──────────────────────────────────────────────────────────────────────

export async function readCase(caseId: string): Promise<Case | null> {
  const client = getReadClient()
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_case',
    args: [caseId],
  }) as string
  if (!raw) return null
  return JSON.parse(raw) as Case
}

export async function readCasesByFiler(filer: string): Promise<Case[]> {
  const all = await readRecentCases(200)
  const target = filer.toLowerCase()
  return all.filter(c => c.filer.toLowerCase() === target)
}

export async function readRecentCases(limit = 20): Promise<Case[]> {
  const client = getReadClient()
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_recent_cases',
    args: [limit],
  }) as string
  return JSON.parse(raw) as Case[]
}

export async function readStats(): Promise<Stats> {
  const client = getReadClient()
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_stats',
    args: [],
  }) as string
  return JSON.parse(raw) as Stats
}

export async function readCaseCount(): Promise<number> {
  const client = getReadClient()
  const count = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_case_count',
    args: [],
  }) as number | bigint
  return Number(count)
}
