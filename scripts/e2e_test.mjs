import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const CONTRACT = '0x46F3A73A7e7Fb331aA1b430d2FCb7eFEBD852CAe'
const RPC_URL  = 'https://studio.genlayer.com/api'

const WALLET_A = {
  address: '0x89B521b1149198C1CDcA1118619dBdA08048609c',
  privateKey: '0xc7e1e465254b42ae0be4c0ef570f50bb01d6b50a23add01cd068c7ed6465dc33',
}
const WALLET_B = {
  address: '0xdD03B1A888a38e4C8b6f6CEE831DC9cd828d8102',
  privateKey: '0x561d7e3dec45ea187356132646c3b3970267b4d2f09e4c51bc8b3b691918eef6',
}

function log(msg) {
  const now = new Date().toISOString().split('T')[1].split('.')[0]
  console.log(`[${now}] ${msg}`)
}

function client(wallet) {
  return createClient({
    chain: studionet,
    account: createAccount(wallet.privateKey),
  })
}

async function readContract(functionName, args = []) {
  const c = createClient({ chain: studionet })
  const raw = await c.readContract({ address: CONTRACT, functionName, args })
  return raw
}

async function writeContract(wallet, functionName, args) {
  const c = client(wallet)
  log(`→ ${functionName}(${args.map(a => typeof a === 'string' && a.length > 60 ? a.slice(0,60)+'…' : a).join(', ')})`)
  const hash = await c.writeContract({
    address: CONTRACT,
    functionName,
    args,
    value: BigInt(0),
  })
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
  log(`  polling for ${label} (max ${maxWaitMs/60000} min)…`)
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

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  log('=== Campus Justice Protocol — End-to-End Test ===')

  // ── Check balances ─────────────────────────────────────────────────────────
  log('\n── Check wallet balances ──')
  const c0 = createClient({ chain: studionet })
  const balA = await c0.getBalance({ address: WALLET_A.address })
  const balB = await c0.getBalance({ address: WALLET_B.address })
  log(`Wallet A (Student):     ${(BigInt(balA) / BigInt(1e18)).toString()} GEN`)
  log(`Wallet B (Institution): ${(BigInt(balB) / BigInt(1e18)).toString()} GEN`)
  if (BigInt(balA) === 0n) {
    log('ERROR: Wallet A has no GEN. Fund at https://studio.genlayer.com')
    process.exit(1)
  }
  if (BigInt(balB) === 0n) {
    log('ERROR: Wallet B has no GEN. Fund at https://studio.genlayer.com')
    process.exit(1)
  }

  // ── Stage 1: File case ─────────────────────────────────────────────────────
  log('\n── Stage 1: File Case (Wallet A — Student) ──')
  const evidenceRefs = JSON.stringify([
    'https://raw.githubusercontent.com/Olawalter/campus-justice-protocol/main/README.md',
    'Invigilator attendance log — Hall B Row 4 Seat 12 — 14 June 2026',
    'Result portal record — score changed 72→47 on 28 June 2026 — Ref AI-2026-0312',
  ])

  const hash1 = await writeContract(WALLET_A, 'file_case', [
    'EXAM_MISCONDUCT',
    'Plagiarism penalty applied without written notice — CSC 401',
    'I received a 25-point deduction on my CSC 401 Software Engineering final examination on grounds of alleged plagiarism. The penalty was applied and published on 28 June 2026 without any prior written notification to me. I was given no opportunity to appear before a panel or respond before the deduction was enforced. The exam was conducted under supervised conditions on 14 June 2026 in Hall B, Row 4, Seat 12. I completed the paper independently. My original score was 72 out of 100, reduced to 47. I request full review and restoration of my score pending a fair hearing per the Student Handbook.',
    evidenceRefs,
    'CSC/2021/0047',
    'Computer Science',
    String(Date.now()),
    'https://raw.githubusercontent.com/Olawalter/campus-justice-protocol/main/README.md',
  ])
  await waitFinalized(WALLET_A, hash1)

  // Read back to get case ID
  const count = await readContract('get_case_count', [])
  const caseId = `CJP-${String(Number(count)).padStart(6, '0')}`
  log(`  case ID: ${caseId}`)

  const caseRaw = await readContract('get_case', [caseId])
  const caseData = JSON.parse(caseRaw)
  log(`  status: ${caseData.status}`)
  log(`  filer: ${caseData.filer}`)
  log(`  evidence refs: ${JSON.stringify(caseData.evidence_refs)}`)
  log(`  policy_url: ${caseData.policy_url || '(none)'}`)

  // ── Stage 2: Institution Response ──────────────────────────────────────────
  log('\n── Stage 2: Submit Response (Wallet B — Institution) ──')
  const hash2 = await writeContract(WALLET_B, 'submit_response', [
    caseId,
    'The Department of Computer Science reviewed the CSC 401 final examination following a sworn invigilator report by Mr. A. Okonkwo on 14 June 2026. The report identified near-identical phrasing across Questions 3, 5, and 7 in two scripts from Hall B. The penalty was applied under Academic Integrity Policy Section 4.2(a), which authorises the Examinations Officer to impose a deduction upon receipt of a verified invigilator report without requiring a pre-penalty hearing. The student case reference AI-2026-0312 was logged in the misconduct register on the examination date. The department maintains the deduction was correctly applied and requests the AI arbitrator uphold the institution decision.',
  ])
  await waitFinalized(WALLET_B, hash2)

  const c2 = JSON.parse(await readContract('get_case', [caseId]))
  log(`  status: ${c2.status}`)
  log(`  respondent: ${c2.respondent}`)
  log(`  response preview: ${c2.response_text.slice(0, 80)}…`)

  // ── Stage 3: Request Judgment ──────────────────────────────────────────────
  log('\n── Stage 3: Request AI Judgment (Wallet A) ──')
  log('  Submitting tx — validators will fetch URL evidence + run LLM (5–15 min)')
  const hash3 = await writeContract(WALLET_A, 'request_judgment', [caseId])
  log(`  judgment tx submitted: ${hash3}`)
  log('  polling for DECIDED…')

  const c3 = await pollUntil(caseId, ['DECIDED', 'FINAL'], 'DECIDED', 15000, 1200000)
  log(`  ✓ status: ${c3.status}`)
  const j = c3.judgment
  log(`  outcome:    ${j.outcome}`)
  log(`  confidence: ${j.confidence}`)
  log(`  reasoning:  ${j.reasoning.slice(0, 200)}…`)
  log(`  findings:   ${JSON.stringify(j.key_findings)}`)
  log(`  recommendation: ${j.recommendation}`)

  // Fetch validator consensus data
  try {
    const c0 = createClient({ chain: studionet })
    const receipt3 = await c0.waitForTransactionReceipt({ hash: hash3, status: TransactionStatus.FINALIZED, retries: 5, interval: 3000 })
    const cd3 = receipt3.consensus_data
    if (cd3?.votes) {
      const votes = Object.entries(cd3.votes)
      const agreed = votes.filter(([,v]) => v === 'agree').length
      log(`  validators: ${agreed}/${votes.length} agreed · rounds: ${receipt3.num_of_rounds} · result: ${receipt3.result_name}`)
      votes.forEach(([addr, vote]) => log(`    ${addr.slice(0,10)}… → ${vote}${addr.toLowerCase() === receipt3.last_leader?.toLowerCase() ? ' [leader]' : ''}`))
    }
  } catch(e) { log(`  (consensus data unavailable: ${e.message})`) }

  // ── Stage 4: File Appeal ───────────────────────────────────────────────────
  log('\n── Stage 4: File Appeal (Wallet A) ──')
  const hash4 = await writeContract(WALLET_A, 'file_appeal', [
    caseId,
    'The original judgment accepted the institution reference to Section 4.2(a) without examining whether the separate procedural requirement under Section 4.2(b) was met. Section 4.2(b) mandates written notification to the student within 48 hours of applying an academic integrity penalty. No such notification was issued before or after the result was published on 28 June 2026. The reasoning also did not address the invigilator log confirming the student sat the exam individually under supervision. I request a senior review that considers this procedural violation independently of the substantive plagiarism question.',
  ])
  await waitFinalized(WALLET_A, hash4)

  const c4 = JSON.parse(await readContract('get_case', [caseId]))
  log(`  status: ${c4.status}`)
  log(`  appeal grounds preview: ${c4.appeal.grounds.slice(0, 80)}…`)

  // ── Stage 5: Request Appeal Judgment ──────────────────────────────────────
  log('\n── Stage 5: Request Appeal Judgment (Wallet A) ──')
  const hash5 = await writeContract(WALLET_A, 'request_appeal_judgment', [caseId])
  log(`  appeal judgment tx submitted: ${hash5}`)

  const c5 = await pollUntil(caseId, ['FINAL'], 'FINAL', 15000, 1200000)
  log(`  ✓ status: ${c5.status}`)
  const fj = c5.final_judgment
  log(`  appeal outcome:    ${fj.outcome}`)
  log(`  appeal confidence: ${fj.confidence}`)
  log(`  appeal reasoning:  ${fj.reasoning.slice(0, 200)}…`)

  // Fetch appeal validator consensus data
  try {
    const c0 = createClient({ chain: studionet })
    const receipt5 = await c0.waitForTransactionReceipt({ hash: hash5, status: TransactionStatus.FINALIZED, retries: 5, interval: 3000 })
    const cd5 = receipt5.consensus_data
    if (cd5?.votes) {
      const votes = Object.entries(cd5.votes)
      const agreed = votes.filter(([,v]) => v === 'agree').length
      log(`  appeal validators: ${agreed}/${votes.length} agreed · rounds: ${receipt5.num_of_rounds} · result: ${receipt5.result_name}`)
      votes.forEach(([addr, vote]) => log(`    ${addr.slice(0,10)}… → ${vote}${addr.toLowerCase() === receipt5.last_leader?.toLowerCase() ? ' [leader]' : ''}`))
    }
  } catch(e) { log(`  (appeal consensus data unavailable: ${e.message})`) }

  // ── Summary ────────────────────────────────────────────────────────────────
  log('\n═══════════════════════════════════')
  log('✓ END-TO-END TEST PASSED')
  log(`  Case:              ${caseId}`)
  log(`  View on app:       https://campusjp.vercel.app/cases/${caseId}`)
  log(`  Judgment outcome:  ${c3.judgment.outcome} (confidence ${c3.judgment.confidence})`)
  log(`  Appeal outcome:    ${c5.final_judgment.outcome} (confidence ${c5.final_judgment.confidence})`)
  log('═══════════════════════════════════')
}

main().catch(e => {
  console.error('\n✗ TEST FAILED:', e.message || e)
  process.exit(1)
})
