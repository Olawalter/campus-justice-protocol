'use client'

import { use, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient, abi } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'
import { Case } from '@/lib/types'
import { readCase } from '@/lib/genlayer'
import { CONTRACT_ADDRESS } from '@/lib/constants'
import { useWallet } from '@/contexts/WalletContext'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { JudgmentPanel } from '@/components/cases/JudgmentPanel'
import { ValidatorConsensusPanel } from '@/components/cases/ValidatorConsensusPanel'
import { EvidencePanel } from '@/components/cases/EvidencePanel'
import { CASE_TYPE_META } from '@/lib/constants'

type FinalityState = 'idle' | 'accepted' | 'finalized' | 'error'

// Stored alongside each judgment tx hash so we can verify the receipt on return
interface StoredJudgmentMeta {
  hash: string
  functionName: string
  caseId: string
}

function DeadlineChip({ label, deadline }: { label: string; deadline: number | null }) {
  if (!deadline) return null
  const now = Math.floor(Date.now() / 1000)
  const passed = now >= deadline
  const date = new Date(deadline * 1000).toLocaleString()
  return (
    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
      style={{
        background: passed ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.08)',
        border: `1px solid ${passed ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'}`,
        color: passed ? '#f87171' : '#4ade80',
      }}>
      <span>{passed ? '🔒' : '⏳'}</span>
      <span>{label}: {passed ? `closed ${date}` : date}</span>
    </div>
  )
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const {
    address, connected,
    requestJudgment, submitResponse,
    fileAppeal, requestAppealJudgment,
    recordJudgmentTx, recordAppealTx,
    txPending,
  } = useWallet()

  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [responseText, setResponseText] = useState('')
  const [appealGrounds, setAppealGrounds] = useState('')
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Finality tracking for judgment transactions
  const [judgmentFinalityState, setJudgmentFinalityState] = useState<FinalityState>('idle')
  const [appealFinalityState, setAppealFinalityState] = useState<FinalityState>('idle')
  const finalityAbortRef = useRef<AbortController | null>(null)

  async function load() {
    setLoading(true)
    try {
      const c = await readCase(id)
      setCaseData(c)
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [id])

  // On mount: find the best available tx hash and run full receipt verification
  // before allowing any judgment to render. Priority:
  //   1. localStorage (this browser dispatched the tx this session / previously)
  //   2. case.judgment_tx_hash / case.appeal_tx_hash (recorded on-chain by the
  //      dispatcher after their own verification — any viewer can use this)
  // If neither exists the judgment stays hidden (state remains 'idle').
  useEffect(() => {
    if (typeof window === 'undefined') return
    const judgmentRaw = localStorage.getItem(`cjp_judgment_tx_${id}`)
    const appealRaw = localStorage.getItem(`cjp_appeal_tx_${id}`)

    readCase(id).then(c => {
      if (!c) return
      setCaseData(c)

      // Judgment hash — prefer localStorage, fall back to on-chain recorded hash
      const judgmentHash: string | null = (() => {
        if (judgmentRaw) {
          try { return (JSON.parse(judgmentRaw) as StoredJudgmentMeta).hash } catch { return null }
        }
        return c.judgment_tx_hash ?? null
      })()
      if (judgmentHash) {
        waitForFinality(
          { hash: judgmentHash, functionName: 'request_judgment', caseId: id },
          'judgment',
        )
      }
      // If no hash available: judgment stays hidden until one is recorded on-chain

      // Appeal hash — same priority order
      const appealHash: string | null = (() => {
        if (appealRaw) {
          try { return (JSON.parse(appealRaw) as StoredJudgmentMeta).hash } catch { return null }
        }
        return c.appeal_tx_hash ?? null
      })()
      if (appealHash) {
        waitForFinality(
          { hash: appealHash, functionName: 'request_appeal_judgment', caseId: id },
          'appeal',
        )
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // record=true when this browser dispatched the tx — after verification passes,
  // the hash is written on-chain so any viewer on any device can verify it too.
  function waitForFinality(meta: StoredJudgmentMeta, kind: 'judgment' | 'appeal', record = false) {
    if (finalityAbortRef.current) finalityAbortRef.current.abort()
    const abort = new AbortController()
    finalityAbortRef.current = abort

    const setState = kind === 'judgment' ? setJudgmentFinalityState : setAppealFinalityState
    setState('accepted')

    const glClient = createClient({ chain: studionet })
    // fullTransaction: true — bypasses simplifyTransactionReceipt so all raw fields
    // (statusName, consensus_data, data.calldata) are preserved exactly as returned
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(glClient as any).waitForTransactionReceipt({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hash: meta.hash as any,
      status: TransactionStatus.FINALIZED,
      retries: 120,
      interval: 5000,
      fullTransaction: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).then(async (receipt: any) => {
      if (abort.signal.aborted) return

      // ── 5-point receipt verification — every check is fail-closed ────────

      // 1. Status must be explicitly FINALIZED
      //    statusName is set by transactionActions.getTransaction (studionet path)
      //    before decodeLocalnetTransaction runs; status field is numeric after that.
      const statusName: string = receipt.statusName ?? receipt.status_name ?? ''
      if (statusName !== 'FINALIZED') { setState('error'); return }

      // 2. Execution must have succeeded
      //    Studionet: execution_result lives in consensus_data.leader_receipt[0]
      //    Testnet/mainnet: txExecutionResultName at top level
      const leaderReceipts = receipt.consensus_data?.leader_receipt
      const leaderReceipt = Array.isArray(leaderReceipts)
        ? leaderReceipts[0]
        : leaderReceipts
      const execResult: string =
        receipt.txExecutionResultName ?? leaderReceipt?.execution_result ?? ''
      // 'SUCCESS' is studionet's value; 'FINISHED_WITH_RETURN' is testnet/mainnet
      if (execResult !== 'SUCCESS' && execResult !== 'FINISHED_WITH_RETURN') {
        setState('error'); return
      }

      // 3. Contract address must match — missing field is an error
      const toAddr: string = (receipt.to_address ?? receipt.recipient ?? '').toLowerCase()
      if (!toAddr || toAddr !== CONTRACT_ADDRESS.toLowerCase()) {
        setState('error'); return
      }

      // 4. Calldata must match the stored function name and case ID
      //    Studionet path (fullTransaction=true): decodeLocalnetTransaction converts
      //      data.calldata from raw base64 string → { base64, readable } object
      //    Testnet/mainnet path: txDataDecoded.callData is a JS Map (from decodeTransaction)
      //    calldata.toString() is NOT valid JSON for arrays (trailing commas) — must
      //    decode raw bytes with abi.calldata.decode, which returns a proper Map.
      let callDataMap: Map<string, unknown> | null = null
      const b64: string = receipt.data?.calldata?.base64 ?? ''
      if (b64) {
        try {
          const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
          const decoded = abi.calldata.decode(bytes)
          if (decoded instanceof Map) callDataMap = decoded
        } catch { setState('error'); return }
      } else {
        const m = receipt.txDataDecoded?.callData
        if (m instanceof Map) callDataMap = m
      }
      if (!callDataMap) { setState('error'); return }

      const fn: unknown = callDataMap.get('method')
      if (typeof fn !== 'string' || fn !== meta.functionName) { setState('error'); return }
      const args: unknown = callDataMap.get('args')
      if (!Array.isArray(args) || !args.length || String(args[0]) !== meta.caseId) {
        setState('error'); return
      }

      // ── All 4 checks passed ───────────────────────────────────────────────

      setState('finalized')
      // 5. Post-finalization state read — only after all checks pass
      const fresh = await readCase(id)
      if (fresh && !abort.signal.aborted) setCaseData(fresh)
      // Record the verified hash on-chain so any viewer on any device can
      // retrieve it and run the same verification independently.
      if (record) {
        const recordFn = kind === 'judgment' ? recordJudgmentTx : recordAppealTx
        recordFn(id, meta.hash).catch(() => { /* best-effort — non-blocking */ })
      }
    }).catch(() => {
      if (!abort.signal.aborted) setState('error')
    })
  }

  useEffect(() => {
    return () => { finalityAbortRef.current?.abort() }
  }, [])

  async function doAction(action: string, fn: () => Promise<string>) {
    setActiveAction(action)
    setActionError(null)
    try {
      const hash = await fn()
      const isJudgment = action === 'judgment'
      const isAppealJudgment = action === 'appeal-judgment'

      if (isJudgment || isAppealJudgment) {
        const key = isAppealJudgment ? `cjp_appeal_tx_${id}` : `cjp_judgment_tx_${id}`
        const fnName = isAppealJudgment ? 'request_appeal_judgment' : 'request_judgment'
        const meta: StoredJudgmentMeta = { hash, functionName: fnName, caseId: id }
        if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(meta))
        waitForFinality(meta, isJudgment ? 'judgment' : 'appeal', true)
      } else {
        await load()
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setActiveAction(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-purple-700 border-t-purple-300 rounded-full spin" />
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p style={{ color: 'var(--color-muted)' }}>Case not found.</p>
        <Link href="/cases" className="text-sm mt-4 inline-block" style={{ color: 'var(--color-primary-light)' }}>← All Cases</Link>
      </div>
    )
  }

  const c = caseData
  const meta = CASE_TYPE_META[c.case_type] ?? { label: c.case_type, icon: '📄' }
  const isFiler = address?.toLowerCase() === c.filer.toLowerCase()
  const isRespondent = address?.toLowerCase() === c.respondent.toLowerCase()
  const isParty = isFiler || isRespondent

  const awaitingJudgment = judgmentFinalityState === 'accepted'
  const awaitingAppealJudgment = appealFinalityState === 'accepted'

  const now = Math.floor(Date.now() / 1000)
  const appealOpen = c.status === 'DECIDED' && c.appeal_deadline && now < c.appeal_deadline && !c.appeal

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
        <Link href="/cases" style={{ color: 'var(--color-primary-light)' }}>Cases</Link>
        <span>/</span>
        <span className="font-mono">{id}</span>
      </div>

      {/* Header */}
      <div className="gl-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>{meta.label}</p>
              <h1 className="text-lg font-bold">{c.title}</h1>
            </div>
          </div>
          <StatusBadge status={c.status} />
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{c.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {([
            { label: 'Student', value: `${c.filer.slice(0, 6)}…${c.filer.slice(-4)}`, mono: true },
            { label: 'Institution', value: c.respondent ? `${c.respondent.slice(0, 6)}…${c.respondent.slice(-4)}` : 'Not set', mono: true },
            c.matric_number ? { label: 'Matric', value: c.matric_number, mono: true } : null,
            c.department ? { label: 'Department', value: c.department } : null,
            { label: 'Filed', value: c.created_at ? new Date(c.created_at * 1000).toLocaleDateString() : '—' },
          ] as Array<{ label: string; value: string; mono?: boolean } | null>)
            .filter((x): x is { label: string; value: string; mono?: boolean } => !!x)
            .map(item => (
              <div key={item.label} className="p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>{item.label}</p>
                <p className={`text-xs font-medium ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
              </div>
          ))}
        </div>

        {/* Deadlines */}
        <div className="flex flex-wrap gap-2 pt-1">
          <DeadlineChip label="Evidence window" deadline={c.evidence_deadline} />
          <DeadlineChip label="Appeal window" deadline={c.appeal_deadline} />
        </div>

        {/* Policy URL */}
        {c.policy_url && (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Institution Policy Document</p>
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.06)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
              <span>📋</span>
              <span className="truncate flex-1">{c.policy_url}</span>
              <span className="shrink-0 opacity-60" style={{ fontFamily: 'sans-serif' }}>live fetch</span>
            </div>
          </div>
        )}
      </div>

      {/* Evidence panel — shown while case is open */}
      {['SUBMITTED', 'RESPONDED'].includes(c.status) && (
        <EvidencePanel caseData={c} onRefresh={load} />
      )}

      {/* Institution response */}
      {c.response_text && (
        <div className="gl-card p-6 space-y-2">
          <p className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>Institution Response</p>
          <p className="text-sm leading-relaxed">{c.response_text}</p>
        </div>
      )}

      {/* Judgments — only rendered after full 5-point finality verification */}
      {c.judgment && judgmentFinalityState === 'finalized' && (
        <>
          <JudgmentPanel judgment={c.judgment} />
          <ValidatorConsensusPanel caseId={c.case_id} />
        </>
      )}
      {c.final_judgment && appealFinalityState === 'finalized' && (
        <>
          <JudgmentPanel judgment={c.final_judgment} isAppeal />
          <ValidatorConsensusPanel caseId={c.case_id} isAppeal />
        </>
      )}

      {/* ── Action Room ─────────────────────────────────────────────────────── */}

      {/* Process timeline */}
      {!['DECIDED', 'FINAL'].includes(c.status) && !awaitingJudgment && !awaitingAppealJudgment && (
        <div className="gl-card p-6">
          <p className="text-xs font-semibold mb-4" style={{ color: 'var(--color-muted)' }}>Case Progress</p>
          <div className="flex items-start gap-0">
            {[
              { label: 'Case Filed', done: true },
              { label: 'Institution Responds', done: ['RESPONDED', 'DELIBERATING'].includes(c.status) },
              { label: 'Evidence Window', done: now >= c.evidence_deadline },
              { label: 'AI Judgment', done: false },
            ].map((step, i, arr) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  {i > 0 && <div className="flex-1 h-px" style={{ background: step.done ? 'var(--color-primary)' : 'var(--color-border)' }} />}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: step.done ? 'var(--color-primary)' : 'rgba(139,92,246,0.08)',
                      color: step.done ? '#fff' : 'var(--color-muted)',
                      border: step.done ? 'none' : '1px solid var(--color-border)',
                    }}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  {i < arr.length - 1 && <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />}
                </div>
                <p className="text-xs mt-1.5 text-center leading-tight"
                  style={{ color: step.done ? 'var(--color-primary-light)' : 'var(--color-muted)' }}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Institution response form */}
      {c.status === 'SUBMITTED' && !c.response_text && connected && isRespondent && (
        <div className="gl-card overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" style={{ boxShadow: '0 0 6px #4ade80' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>Action Room — Submit Official Response</p>
            </div>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              As the designated respondent, submit your official position statement. You can also add evidence URLs above.
            </p>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              rows={6}
              placeholder="Address the complaint directly. Reference relevant policies, records, or procedures. Minimum 30 characters."
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
            />
            {actionError && (
              <div className="p-3 rounded-lg text-xs"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                {actionError}
              </div>
            )}
            <button
              onClick={() => doAction('response', () => submitResponse(c.case_id, responseText))}
              disabled={txPending || responseText.trim().length < 30}
              className="px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--color-primary)', color: '#fff', opacity: (txPending || responseText.trim().length < 30) ? 0.6 : 1 }}
            >
              {activeAction === 'response' ? 'Submitting…' : 'Submit Response'}
            </button>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{responseText.trim().length}/30 min characters</p>
          </div>
        </div>
      )}

      {/* Waiting for institution — shown to filer */}
      {c.status === 'SUBMITTED' && !c.response_text && connected && isFiler && (
        <div className="gl-card p-5 space-y-3" style={{ border: '1px solid rgba(124,58,237,0.2)' }}>
          <p className="text-sm font-medium">Waiting for institution response</p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Share the case link with the institution ({c.respondent.slice(0,8)}…) so they can connect their wallet and respond.
            You can request AI judgment once both parties have submitted evidence, or after the evidence window closes.
          </p>
          {actionError && (
            <div className="p-3 rounded-lg text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
              {actionError}
            </div>
          )}
          <button
            onClick={() => doAction('judgment', () => requestJudgment(c.case_id))}
            disabled={txPending}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)', opacity: txPending ? 0.6 : 1 }}
          >
            {activeAction === 'judgment' && <span className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full spin inline-block mr-2" />}
            Request AI Judgment (both parties submitted evidence)
          </button>
        </div>
      )}

      {/* Ready for judgment — RESPONDED state */}
      {c.status === 'RESPONDED' && !awaitingJudgment && (
        <div className="gl-card overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>Action Room — Ready for AI Judgment</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}>
              Both sides heard
            </span>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              The institution has responded. Request AI arbitration — validators will independently fetch all evidence URLs and reach consensus.
            </p>
            {actionError && (
              <div className="p-3 rounded-lg text-xs"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                {actionError}
              </div>
            )}
            {connected && isFiler && (
              <button
                onClick={() => doAction('judgment', () => requestJudgment(c.case_id))}
                disabled={txPending}
                className="px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ background: 'var(--color-primary)', color: '#fff', opacity: txPending ? 0.6 : 1 }}
              >
                {activeAction === 'judgment' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin" />}
                Request AI Judgment
              </button>
            )}
            {!connected && (
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Connect as the case filer to request AI judgment.</p>
            )}
          </div>
        </div>
      )}

      {/* Awaiting finality — judgment tx accepted, waiting for FINALIZED */}
      {(awaitingJudgment || awaitingAppealJudgment) && (
        <div className="gl-card p-6 space-y-3" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 border-2 border-purple-700 border-t-purple-300 rounded-full spin shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-primary-light)' }}>
                Accepted → awaiting finality
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                The transaction was accepted by validators and is in Optimistic Democracy&apos;s appeal window.
                The judgment will be displayed once the transaction reaches FINALIZED status — typically 5–15 minutes.
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                You can navigate away and return — this page will resume the finality check automatically.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              const fresh = await readCase(id)
              if (fresh) setCaseData(fresh)
            }}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}
          >
            Check status now
          </button>
        </div>
      )}

      {/* Finality error */}
      {(judgmentFinalityState === 'error' || appealFinalityState === 'error') && (
        <div className="gl-card p-5 space-y-2" style={{ border: '1px solid rgba(248,113,113,0.2)' }}>
          <p className="text-sm font-medium" style={{ color: '#f87171' }}>Finality check timed out</p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            The transaction may still finalize — click below to refresh the case state.
          </p>
          <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            Refresh case
          </button>
        </div>
      )}

      {/* Appeal room — open to both parties within appeal_deadline */}
      {connected && isParty && appealOpen && (
        <div className="gl-card overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="px-6 py-4" style={{ background: 'rgba(124,58,237,0.06)', borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>Appeal Room</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Disagree with the judgment? {isFiler ? 'As the student, you' : 'As the institution, you'} can file an appeal before the window closes.
            </p>
          </div>
          <div className="p-6 space-y-3">
            {actionError && (
              <div className="p-3 rounded-lg text-xs"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                {actionError}
              </div>
            )}
            <textarea
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              rows={4}
              placeholder="Explain why this judgment should be reconsidered. Reference specific facts, procedural errors, or overlooked evidence."
              value={appealGrounds}
              onChange={e => setAppealGrounds(e.target.value)}
            />
            <button
              onClick={() => doAction('appeal', () => fileAppeal(c.case_id, appealGrounds))}
              disabled={txPending || appealGrounds.trim().length < 20}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)', opacity: (txPending || appealGrounds.trim().length < 20) ? 0.6 : 1 }}
            >
              {activeAction === 'appeal' ? 'Filing…' : 'File Appeal'}
            </button>
          </div>
        </div>
      )}

      {/* Appeal judgment room */}
      {connected && isParty && c.status === 'APPEALED' && !awaitingAppealJudgment && (
        <div className="gl-card overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="px-6 py-4" style={{ background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>Appeal Room — Ready for Senior Review</p>
          </div>
          <div className="p-6 space-y-3">
            {c.appeal && (
              <div className="p-3 rounded-lg text-xs space-y-1"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)' }}>
                <p className="font-medium" style={{ color: 'var(--color-primary-light)' }}>
                  Appeal filed by {c.appeal.appellant_role}
                </p>
                <p style={{ color: 'var(--color-muted)' }}>{c.appeal.grounds}</p>
              </div>
            )}
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Request a senior AI review — validators will re-examine the full case including the appeal grounds.
            </p>
            {actionError && (
              <div className="p-3 rounded-lg text-xs"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                {actionError}
              </div>
            )}
            <button
              onClick={() => doAction('appeal-judgment', () => requestAppealJudgment(c.case_id))}
              disabled={txPending}
              className="px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ background: 'var(--color-primary)', color: '#fff', opacity: txPending ? 0.6 : 1 }}
            >
              {activeAction === 'appeal-judgment' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin" />}
              Request Appeal Judgment
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
