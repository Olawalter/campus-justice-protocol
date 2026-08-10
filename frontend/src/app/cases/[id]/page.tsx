'use client'

import { use, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Case, Judgment } from '@/lib/types'
import { readCase } from '@/lib/genlayer'
import { verifyJudgmentFinality, FinalityMeta } from '@/lib/finality'
import { useWallet } from '@/contexts/WalletContext'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { JudgmentPanel } from '@/components/cases/JudgmentPanel'
import { ValidatorConsensusPanel } from '@/components/cases/ValidatorConsensusPanel'
import { EvidencePanel } from '@/components/cases/EvidencePanel'
import { CASE_TYPE_META, RPC_URL } from '@/lib/constants'

type FinalityState = 'idle' | 'pending' | 'accepted' | 'finalized' | 'error'

// Re-exported from lib/finality so localStorage writes and reads use the same shape
type StoredJudgmentMeta = FinalityMeta

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
  const activeActionRef = useRef<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Finality tracking — never 'finalized' until verifyJudgmentFinality passes all checks
  const [judgmentFinalityState, setJudgmentFinalityState] = useState<FinalityState>('idle')
  const [appealFinalityState, setAppealFinalityState] = useState<FinalityState>('idle')
  // Verified tx hashes — set only after verifyJudgmentFinality succeeds; passed to
  // ValidatorConsensusPanel so it never reads an unverified hash from localStorage.
  const [judgmentTxHash, setJudgmentTxHash] = useState<string | null>(null)
  const [appealTxHash, setAppealTxHash] = useState<string | null>(null)
  // Verified judgment data — set ONLY by verifyJudgmentFinality on ok:true.
  // Never sourced from caseData directly, so subsequent load() calls cannot
  // overwrite post-finalization data or expose accepted-state results.
  const [verifiedJudgment, setVerifiedJudgment] = useState<Judgment | null>(null)
  const [verifiedAppealJudgment, setVerifiedAppealJudgment] = useState<Judgment | null>(null)
  // Recording the verified hash on-chain (record_judgment_tx/record_appeal_tx)
  // is a SECOND wallet transaction, fired right after the judgment already
  // renders — easy to miss if the wallet popup isn't visibly flagged. Without
  // this state the recording step was silent: if the user didn't notice and
  // approve that second popup, it failed with no visible error, leaving the
  // case permanently invisible to third-party viewers. Surfaced explicitly so
  // the user knows to expect it and can retry if it fails.
  type RecordState = 'idle' | 'recording' | 'done' | 'failed'
  const [judgmentRecordState, setJudgmentRecordState] = useState<RecordState>('idle')
  const [appealRecordState, setAppealRecordState] = useState<RecordState>('idle')
  // Raw on-chain status string (PENDING/PROPOSING/COMMITTING/REVEALING/ACCEPTED/...)
  // surfaced directly instead of collapsing every pre-ACCEPTED phase into one
  // generic label — GenLayer's consensus process has real distinct phases and
  // showing which one is active is more honest than a static message.
  const [judgmentConsensusPhase, setJudgmentConsensusPhase] = useState<string | null>(null)
  const [appealConsensusPhase, setAppealConsensusPhase] = useState<string | null>(null)
  const judgmentAbortRef = useRef<AbortController | null>(null)
  const appealAbortRef = useRef<AbortController | null>(null)

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
  //
  // All receipt verification is delegated to verifyJudgmentFinality (lib/finality.ts)
  // which is the single authoritative check used by every judgment display path.
  function waitForFinality(meta: StoredJudgmentMeta, kind: 'judgment' | 'appeal', record = false) {
    const abortRef = kind === 'judgment' ? judgmentAbortRef : appealAbortRef
    if (abortRef.current) abortRef.current.abort()
    const abort = new AbortController()
    abortRef.current = abort

    const setState = kind === 'judgment' ? setJudgmentFinalityState : setAppealFinalityState
    const setPhase = kind === 'judgment' ? setJudgmentConsensusPhase : setAppealConsensusPhase
    setState('pending')
    setPhase(null)

    // Poll until the tx reaches ACCEPTED (validator consensus) before showing
    // "Accepted → awaiting finality". Prior to ACCEPTED the tx moves through
    // PENDING/PROPOSING/COMMITTING/REVEALING — all real, distinct consensus
    // phases, not one blob. We surface whichever raw status is currently on
    // chain, and log every transition with a timestamp so a "phase skipped"
    // report can be diagnosed precisely rather than guessed at: GenLayer
    // Studio starts running validator consensus the moment the transaction
    // is submitted, not when this poll begins, so a slow wallet-approval
    // click can genuinely let consensus finish before the very first check.
    // Polling fast from the first instant is the only way to catch a phase
    // that completes in a few seconds.
    const pollStart = Date.now()
    let pollCount = 0
    const pollAccepted = async () => {
      while (!abort.signal.aborted) {
        pollCount++
        try {
          const res = await fetch(`${RPC_URL}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionByHash', params: [meta.hash] }),
          })
          const json = await res.json() as { result?: Record<string, unknown> }
          const status = (json.result?.status ?? '') as string
          // eslint-disable-next-line no-console
          console.debug(`[finality:${kind}] poll #${pollCount} +${Date.now() - pollStart}ms status=${status || '(none)'}`)
          if (status && status !== 'ACCEPTED' && status !== 'FINALIZED') setPhase(status)
          if (status === 'ACCEPTED' || status === 'FINALIZED') return
        } catch { /* network hiccup — retry */ }
        // Fast cadence for the first ~10s to catch short-lived phases, then
        // back off to reduce request volume for longer waits.
        await new Promise(r => setTimeout(r, Date.now() - pollStart < 10000 ? 500 : 3000))
      }
    }

    pollAccepted()
      .then(() => { if (!abort.signal.aborted) setState('accepted') })
      .catch(() => {})

    verifyJudgmentFinality(meta, abort.signal)
      .then(result => {
        if (abort.signal.aborted) return
        if (!result.ok) {
          // Any failed check — missing field, mismatch, network error, stale contract
          // read — lands here. Never render the judgment in this state.
          setState('error')
          return
        }

        // result.caseData is the post-finalization fresh read from verifyJudgmentFinality
        // Step 5 — it confirmed DECIDED/FINAL status and a populated judgment field.
        // Store the judgment content in dedicated verified state so that subsequent
        // load() calls can never overwrite it with accepted-state contract reads.
        setCaseData(result.caseData)
        if (kind === 'judgment') {
          setVerifiedJudgment(result.caseData.judgment)
          setJudgmentTxHash(meta.hash)
        } else {
          setVerifiedAppealJudgment(result.caseData.final_judgment)
          setAppealTxHash(meta.hash)
        }
        setState('finalized')

        // Record the verified hash on-chain so any viewer on any device can
        // retrieve it and run the same verification independently. This is a
        // SEPARATE wallet transaction — surface it explicitly so a second
        // wallet popup doesn't go unnoticed and silently fail.
        if (record) {
          const setRecordState = kind === 'judgment' ? setJudgmentRecordState : setAppealRecordState
          setRecordState('recording')
          const recordFn = kind === 'judgment' ? recordJudgmentTx : recordAppealTx
          recordFn(meta.caseId, meta.hash)
            .then(() => setRecordState('done'))
            .catch(() => setRecordState('failed'))
        }
      })
      .catch(() => {
        if (!abort.signal.aborted) setState('error')
      })
  }

  // Re-triggers verification for one kind, used by both the "Check status now"
  // button (state 'pending'/'accepted') and the "Refresh case" button on the
  // error panel (state 'error' — e.g. after a transient RPC/CORS outage).
  // Same hash lookup priority as the mount effect: localStorage first (this
  // browser dispatched the tx), falling back to the on-chain recorded hash.
  function retryVerification(kind: 'judgment' | 'appeal') {
    const raw = localStorage.getItem(kind === 'judgment' ? `cjp_judgment_tx_${id}` : `cjp_appeal_tx_${id}`)
    const fnName = kind === 'judgment' ? 'request_judgment' : 'request_appeal_judgment'
    let hash: string | null = null
    if (raw) {
      try { hash = (JSON.parse(raw) as StoredJudgmentMeta).hash } catch { /* ignore */ }
    }
    if (!hash) {
      hash = kind === 'judgment' ? (caseData?.judgment_tx_hash ?? null) : (caseData?.appeal_tx_hash ?? null)
    }
    // record=true: if this retry succeeds and the on-chain hash was never
    // recorded (e.g. the original attempt was interrupted by a network
    // outage before reaching record_judgment_tx), this completes that step.
    // Safe to always pass — the contract call is a caller===filer/respondent
    // check and waitForFinality already treats recordFn failures as
    // best-effort, so a third-party viewer's retry just fails that part
    // silently without affecting their own verification result.
    if (hash) waitForFinality({ hash, functionName: fnName, caseId: id }, kind, true)
  }

  // Retries only the record_judgment_tx/record_appeal_tx step, for when
  // verification already succeeded locally (judgment is visible) but the
  // recording transaction failed or its wallet popup was missed/dismissed.
  function retryRecord(kind: 'judgment' | 'appeal') {
    const hash = kind === 'judgment' ? judgmentTxHash : appealTxHash
    if (!hash) return
    const setRecordState = kind === 'judgment' ? setJudgmentRecordState : setAppealRecordState
    setRecordState('recording')
    const recordFn = kind === 'judgment' ? recordJudgmentTx : recordAppealTx
    recordFn(id, hash)
      .then(() => setRecordState('done'))
      .catch(() => setRecordState('failed'))
  }

  useEffect(() => {
    return () => {
      judgmentAbortRef.current?.abort()
      appealAbortRef.current?.abort()
    }
  }, [])

  async function doAction(action: string, fn: () => Promise<string>) {
    // Synchronous re-entrancy guard — activeActionRef updates immediately,
    // unlike React state (setActiveAction), which only takes effect on the
    // next render. Without this, a fast double-click can fire doAction twice
    // before the disabled= state re-renders, dispatching two on-chain
    // transactions for the same action. If the second one fails (e.g. the
    // contract rejects re-requesting judgment on an already-decided case),
    // its hash still overwrites the first (successful) one in localStorage,
    // orphaning the real result and making the UI report it as never happened.
    if (activeActionRef.current !== null) return
    activeActionRef.current = action
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
      activeActionRef.current = null
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

  const awaitingJudgment = judgmentFinalityState === 'pending' || judgmentFinalityState === 'accepted'
  const awaitingAppealJudgment = appealFinalityState === 'pending' || appealFinalityState === 'accepted'

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
      {verifiedJudgment && judgmentFinalityState === 'finalized' && (
        <>
          <JudgmentPanel judgment={verifiedJudgment} />
          {judgmentTxHash && <ValidatorConsensusPanel txHash={judgmentTxHash} />}
          {judgmentRecordState === 'recording' && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}>
              Recording this result on-chain so anyone can verify it — a second wallet approval popup should appear now. Please approve it.
            </div>
          )}
          {judgmentRecordState === 'failed' && (
            <div className="text-xs px-3 py-2 rounded-lg flex items-center justify-between gap-3" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span>On-chain recording failed or the wallet popup was missed — this case won&apos;t be visible to other viewers yet.</span>
              <button onClick={() => retryRecord('judgment')} className="shrink-0 px-2 py-1 rounded"
                style={{ background: 'rgba(239,68,68,0.15)' }}>Retry</button>
            </div>
          )}
        </>
      )}
      {verifiedAppealJudgment && appealFinalityState === 'finalized' && (
        <>
          <JudgmentPanel judgment={verifiedAppealJudgment} isAppeal />
          {appealTxHash && <ValidatorConsensusPanel txHash={appealTxHash} isAppeal />}
          {appealRecordState === 'recording' && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}>
              Recording this result on-chain so anyone can verify it — a second wallet approval popup should appear now. Please approve it.
            </div>
          )}
          {appealRecordState === 'failed' && (
            <div className="text-xs px-3 py-2 rounded-lg flex items-center justify-between gap-3" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span>On-chain recording failed or the wallet popup was missed — this case won&apos;t be visible to other viewers yet.</span>
              <button onClick={() => retryRecord('appeal')} className="shrink-0 px-2 py-1 rounded"
                style={{ background: 'rgba(239,68,68,0.15)' }}>Retry</button>
            </div>
          )}
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
              disabled={txPending || activeAction !== null || responseText.trim().length < 30}
              className="px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--color-primary)', color: '#fff', opacity: (txPending || activeAction !== null || responseText.trim().length < 30) ? 0.6 : 1 }}
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
            disabled={txPending || activeAction !== null}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)', opacity: (txPending || activeAction !== null) ? 0.6 : 1 }}
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
                disabled={txPending || activeAction !== null}
                className="px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ background: 'var(--color-primary)', color: '#fff', opacity: (txPending || activeAction !== null) ? 0.6 : 1 }}
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

      {/* Pending / awaiting finality — two-phase display with raw consensus phase */}
      {(awaitingJudgment || awaitingAppealJudgment) && (() => {
        const isPending =
          (awaitingJudgment && judgmentFinalityState === 'pending') ||
          (awaitingAppealJudgment && appealFinalityState === 'pending')
        const phase = awaitingJudgment ? judgmentConsensusPhase : appealConsensusPhase
        return (
        <div className="gl-card p-6 space-y-3" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 border-2 border-purple-700 border-t-purple-300 rounded-full spin shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-primary-light)' }}>
                {isPending
                  ? `Submitted${phase ? ` → ${phase}` : ' → waiting for validator consensus'}`
                  : 'Accepted → awaiting finality'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                {isPending
                  ? 'The transaction has been submitted. Validators are independently running the AI model and reaching consensus — this takes 2–5 minutes.'
                  : 'Validators reached consensus and accepted the result. The judgment will display once the transaction passes the finality window — typically 5–15 minutes total.'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                You can navigate away and return — this page will resume the check automatically.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (awaitingJudgment) retryVerification('judgment')
              if (awaitingAppealJudgment) retryVerification('appeal')
            }}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}
          >
            Check status now
          </button>
        </div>
        )
      })()}

      {/* Finality error */}
      {(judgmentFinalityState === 'error' || appealFinalityState === 'error') && (
        <div className="gl-card p-5 space-y-2" style={{ border: '1px solid rgba(248,113,113,0.2)' }}>
          <p className="text-sm font-medium" style={{ color: '#f87171' }}>Finality check failed</p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            This can happen from a transient network or RPC outage — the transaction itself may still be fine.
            Click below to retry the full verification.
          </p>
          <button
            onClick={() => {
              if (judgmentFinalityState === 'error') retryVerification('judgment')
              if (appealFinalityState === 'error') retryVerification('appeal')
            }}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            Retry verification
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
              disabled={txPending || activeAction !== null || appealGrounds.trim().length < 20}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)', opacity: (txPending || activeAction !== null || appealGrounds.trim().length < 20) ? 0.6 : 1 }}
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
              disabled={txPending || activeAction !== null}
              className="px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ background: 'var(--color-primary)', color: '#fff', opacity: (txPending || activeAction !== null) ? 0.6 : 1 }}
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
