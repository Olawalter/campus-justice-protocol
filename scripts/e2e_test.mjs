/**
 * Campus Justice Protocol — End-to-End Test
 *
 * Reads private keys from scripts/.env (never committed).
 * Copy scripts/.env.example → scripts/.env and fill in funded wallet keys.
 *
 * Run from the frontend/ directory so node_modules resolves:
 *   cd frontend && node --input-type=module < ../scripts/e2e_test.mjs
 */

import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env ────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url))
let envVars = {}
try {
  const envPath = resolve(__dir, '.env')
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [k, ...rest] = trimmed.split('=')
    if (k) envVars[k.trim()] = rest.join('=').trim()
  }
} catch {
  // Fall back to process.env (CI/CD environments set these directly)
}

const PK_A = envVars['TEST_WALLET_A_PK'] || process.env.TEST_WALLET_A_PK
const PK_B = envVars['TEST_WALLET_B_PK'] || process.env.TEST_WALLET_B_PK

if (!PK_A || !PK_B) {
  console.error('ERROR: TEST_WALLET_A_PK and TEST_WALLET_B_PK must be set in scripts/.env or environment.')
  console.error('Copy scripts/.env.example → scripts/.env and fill in your funded wallet private keys.')
  process.exit(1)
}

// ── Config ───────────────────────────────────────────────────────────────────

const CONTRACT = '0x83a1ebE176E58f286ee1C934E3513FF48995B916'

const WALLET_A = { privateKey: PK_A }
const WALLET_B = { privateKey: PK_B }

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  const now = new Date().toISOString().split('T')[1].split('.')[0]
  console.log(`[${now}] ${msg}`)
}

function client(wallet) {
  return createClient({ chain: studionet, account: createAccount(wallet.privateKey) })
}

async function readContract(functionName, args = []) {
  const c = createClient({ chain: studionet })
  return c.readContract({ address: CONTRACT, functionName, args })
}

async function writeContract(wallet, functionName, args) {
  const c = client(wallet)
  const preview = args.map(a => typeof a === 'string' && a.length > 60 ? a.slice(0, 60) + '…' : a).join(', ')
  log(`→ ${functionName}(${preview})`)
  const hash = await c.writeContract({ address: CONTRACT, functionName, args, value: BigInt(0) })
  log(`  tx: ${hash}`)
  return hash
}

async function waitFinalized(wallet, hash) {
  const c = client(wallet)
  log(`  waiting for FINALIZED…`)
  await c.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 60,
    interval: 3000,
  })
  log(`  ✓ finalized`)
}

async function pollUntil(caseId, targetStatuses, label, intervalMs = 15000, maxWaitMs = 1200000) {
  log(`  polling for ${label} (max ${maxWaitMs / 60000} min)…`)
  const deadline = Date.now() + maxWaitMs
  while (Date.now() < deadline) {
    const raw = await readContract('get_case', [caseId])
    const c = JSON.parse(raw)
    log(`  status: ${c.status}`)
    if (targetStatuses.includes(c.status)) return c
    await new Promise(r => setTimeout(r, intervalMs))
  }
  throw new Error(`Timed out waiting for ${label}`)
}

async function logConsensus(hash) {
  try {
    const c = createClient({ chain: studionet })
    const receipt = await c.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.FINALIZED,
      retries: 5,
      interval: 3000,
    })
    const cd = receipt.consensus_data
    if (cd?.votes) {
      const votes = Object.entries(cd.votes)
      const agreed = votes.filter(([, v]) => v === 'agree').length
      log(`  validators: ${agreed}/${votes.length} agreed · rounds: ${receipt.num_of_rounds} · result: ${receipt.result_name}`)
      votes.forEach(([addr, vote]) =>
        log(`    ${addr.slice(0, 10)}… → ${vote}${addr.toLowerCase() === receipt.last_leader?.toLowerCase() ? ' [leader]' : ''}`)
      )
    }
  } catch (e) {
    log(`  (consensus data unavailable: ${e.message})`)
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('=== Campus Justice Protocol — End-to-End Test ===')

  // Derive addresses from private keys
  const accA = createAccount(PK_A)
  const accB = createAccount(PK_B)
  const addrA = accA.address
  const addrB = accB.address

  log(`\nWallet A (Student):     ${addrA}`)
  log(`Wallet B (Institution): ${addrB}`)

  // Check balances
  const c0 = createClient({ chain: studionet })
  const balA = await c0.getBalance({ address: addrA })
  const balB = await c0.getBalance({ address: addrB })
  log(`Balance A: ${(BigInt(balA) / BigInt(1e18)).toString()} GEN`)
  log(`Balance B: ${(BigInt(balB) / BigInt(1e18)).toString()} GEN`)
  if (BigInt(balA) === 0n || BigInt(balB) === 0n) {
    log('ERROR: Both wallets need GEN. Fund at https://studio.genlayer.com')
    process.exit(1)
  }

  // ── Stage 1: File case ─────────────────────────────────────────────────────
  log('\n── Stage 1: File Case (Wallet A — Student) ──')
  const hash1 = await writeContract(WALLET_A, 'file_case', [
    'EXAM_MISCONDUCT',
    'Plagiarism penalty applied without written notice — CSC 401',
    'I received a 25-point deduction on my CSC 401 final examination for alleged plagiarism applied on 28 June 2026 without prior written notification, no opportunity to be heard, and no disclosure of the evidence used. My original score was 72, reduced to 47. I request full review.',
    'CSC/2021/0047',
    'Computer Science',
    addrB,
    'https://raw.githubusercontent.com/Olawalter/campus-justice-protocol/main/README.md',
  ])
  await waitFinalized(WALLET_A, hash1)

  const count = await readContract('get_case_count', [])
  const caseId = `CJP-${String(Number(count)).padStart(6, '0')}`
  const caseRaw = await readContract('get_case', [caseId])
  const caseData = JSON.parse(caseRaw)
  log(`  case ID: ${caseId}`)
  log(`  status: ${caseData.status}`)
  log(`  respondent: ${caseData.respondent}`)
  log(`  evidence_deadline: ${new Date(caseData.evidence_deadline * 1000).toISOString()}`)

  // ── Stage 2: Both parties submit evidence ──────────────────────────────────
  log('\n── Stage 2a: Student submits evidence (Wallet A) ──')
  const hash2a = await writeContract(WALLET_A, 'submit_evidence', [
    caseId,
    'https://raw.githubusercontent.com/Olawalter/campus-justice-protocol/main/README.md',
    'Invigilator attendance log and exam sitting record — Hall B Row 4 Seat 12',
  ])
  await waitFinalized(WALLET_A, hash2a)

  log('\n── Stage 2b: Institution submits evidence (Wallet B) ──')
  const hash2b = await writeContract(WALLET_B, 'submit_evidence', [
    caseId,
    'https://raw.githubusercontent.com/Olawalter/campus-justice-protocol/main/README.md',
    'Invigilator sworn report and academic misconduct register — Ref AI-2026-0312',
  ])
  await waitFinalized(WALLET_B, hash2b)

  // ── Stage 3: Institution submits response ──────────────────────────────────
  log('\n── Stage 3: Institution Response (Wallet B) ──')
  const hash3 = await writeContract(WALLET_B, 'submit_response', [
    caseId,
    'The Department of Computer Science applied a 25-point deduction under Academic Integrity Policy Section 4.2(a) following a sworn invigilator report identifying near-identical phrasing across two scripts. The penalty was applied without a pre-penalty hearing as permitted under 4.2(a). The misconduct was logged as AI-2026-0312. The department maintains the deduction was correctly applied and requests the arbitrator uphold the institution decision.',
  ])
  await waitFinalized(WALLET_B, hash3)

  const c3 = JSON.parse(await readContract('get_case', [caseId]))
  log(`  status: ${c3.status}`)

  // ── Stage 4: Request judgment ──────────────────────────────────────────────
  log('\n── Stage 4: Request AI Judgment (Wallet A) ──')
  log('  Both parties have submitted evidence — early judgment request allowed.')
  const hash4 = await writeContract(WALLET_A, 'request_judgment', [caseId])
  log(`  judgment tx: ${hash4}`)
  log('  polling for DECIDED…')

  const c4 = await pollUntil(caseId, ['DECIDED', 'FINAL'], 'DECIDED', 15000, 1200000)
  log(`  ✓ status: ${c4.status}`)
  const j = c4.judgment
  log(`  outcome:    ${j.outcome}`)
  log(`  confidence: ${j.confidence}`)
  log(`  reasoning:  ${j.reasoning.slice(0, 200)}…`)
  log(`  findings:   ${JSON.stringify(j.key_findings)}`)
  log(`  recommendation: ${j.recommendation}`)
  await logConsensus(hash4)

  // ── Stage 5: File appeal ───────────────────────────────────────────────────
  log('\n── Stage 5: File Appeal (Wallet A — Student) ──')
  const hash5 = await writeContract(WALLET_A, 'file_appeal', [
    caseId,
    'The judgment did not address the procedural violation under Section 4.2(b), which mandates written notification to the student within 48 hours of applying a penalty. No written notice was issued. I request a senior review that considers this procedural violation independently of the substantive plagiarism question.',
  ])
  await waitFinalized(WALLET_A, hash5)
  const c5 = JSON.parse(await readContract('get_case', [caseId]))
  log(`  status: ${c5.status}`)
  log(`  appellant role: ${c5.appeal.appellant_role}`)

  // ── Stage 6: Appeal judgment ───────────────────────────────────────────────
  log('\n── Stage 6: Request Appeal Judgment (Wallet A) ──')
  const hash6 = await writeContract(WALLET_A, 'request_appeal_judgment', [caseId])
  log(`  appeal judgment tx: ${hash6}`)

  const c6 = await pollUntil(caseId, ['FINAL'], 'FINAL', 15000, 1200000)
  log(`  ✓ status: ${c6.status}`)
  log(`  appeal outcome:    ${c6.final_judgment.outcome}`)
  log(`  appeal confidence: ${c6.final_judgment.confidence}`)
  log(`  appeal reasoning:  ${c6.final_judgment.reasoning.slice(0, 200)}…`)
  log(`  finalized_at: ${new Date(c6.finalized_at * 1000).toISOString()}`)
  await logConsensus(hash6)

  // ── Summary ────────────────────────────────────────────────────────────────
  log('\n═══════════════════════════════════')
  log('✓ END-TO-END TEST PASSED')
  log(`  Case:             ${caseId}`)
  log(`  View on app:      https://campusjp.vercel.app/cases/${caseId}`)
  log(`  Judgment:         ${c4.judgment.outcome} (confidence ${c4.judgment.confidence})`)
  log(`  Appeal judgment:  ${c6.final_judgment.outcome} (confidence ${c6.final_judgment.confidence})`)
  log('═══════════════════════════════════')
}

main().catch(e => {
  console.error('\n✗ TEST FAILED:', e.message || e)
  process.exit(1)
})
