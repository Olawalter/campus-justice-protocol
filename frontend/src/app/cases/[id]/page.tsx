'use client'

import { use, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'
import { Case } from '@/lib/types'
import { readCase } from '@/lib/genlayer'
import { useWallet } from '@/contexts/WalletContext'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { JudgmentPanel } from '@/components/cases/JudgmentPanel'
import { ValidatorConsensusPanel } from '@/components/cases/ValidatorConsensusPanel'
import { EvidencePanel } from '@/components/cases/EvidencePanel'
import { CASE_TYPE_META } from '@/lib/constants'

type FinalityState = 'idle' | 'accepted' | 'finalized' | 'error'

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

  // On mount: resume finality wait if a judgment tx hash is in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const judgmentHash = localStorage.getItem(`cjp_judgment_tx_${id}`)
    const appealHash = localStorage.getItem(`cjp_appeal_tx_${id}`)

    // Only start waiting if case hasn't already reached a terminal state
    readCase(id).then(c => {
      if (!c) return
      setCaseData(c)
      if (c.status !== 'DECIDED' && c.status !== 'FINAL' && judgmentHash) {
        waitForFinality(judgmentHash, 'judgment')
      }
      if (c.status !== 'FINAL' && c.status === 'APPEALED' && appealHash) {
        waitForFinality(appealHash, 'appeal')
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function waitForFinality(hash: string, kind: 'judgment' | 'appeal') {
    if (finalityAbortRef.current) finalityAbortRef.current.abort()
    const abort = new AbortController()
    finalityAbortRef.current = abort

    const setState = kind === 'judgment' ? setJudgmentFinalityState : setAppealFinalityState

    setState('accepted')

    const client = createClient({ chain: studionet })
    client.waitForTransactionReceipt({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hash: hash as any,
      status: TransactionStatus.FINALIZED,
      retries: 120,
      interval: 5000,
    }).then(async () => {
      if (abort.signal.aborted) return
      setState('finalized')
      // Post-finalization state read
      const fresh = await readCase(id)
      if (fresh && !abort.signal.aborted) {
        setCaseData(fresh)
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
        if (typeof window !== 'undefined') localStorage.setItem(key, hash)
        waitForFinality(hash, isJudgment ? 'judgment' : 'appeal')
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

      {/* Judgments — shown only after FINALIZED */}
      {c.judgment && judgmentFinalityState !== 'accepted' && (
        <>
          <JudgmentPanel judgment={c.judgment} />
          <ValidatorConsensusPanel caseId={c.case_id} />
        </>
      )}
      {c.final_judgment && appealFinalityState !== 'accepted' && (
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
