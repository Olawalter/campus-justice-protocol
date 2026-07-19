'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Case } from '@/lib/types'
import { readCase } from '@/lib/genlayer'
import { useWallet } from '@/contexts/WalletContext'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { JudgmentPanel } from '@/components/cases/JudgmentPanel'
import { ValidatorConsensusPanel } from '@/components/cases/ValidatorConsensusPanel'
import { CASE_TYPE_META } from '@/lib/constants'

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { address, connected, requestJudgment, submitResponse, fileAppeal, requestAppealJudgment, txPending } = useWallet()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [responseText, setResponseText] = useState('')
  const [appealGrounds, setAppealGrounds] = useState('')
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  // Local flag: judgment tx submitted but not yet finalized on-chain
  const [awaitingJudgment, setAwaitingJudgment] = useState(false)

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

  // Auto-poll every 15s while a judgment tx is in-flight (GenLayer LLM consensus takes minutes)
  // DELIBERATING is an in-tx state; on-chain it jumps directly SUBMITTED → DECIDED.
  // We use a local flag (awaitingJudgment) set on submit, cleared on DECIDED/FINAL.
  useEffect(() => {
    if (!awaitingJudgment) return
    const timer = setInterval(async () => {
      const fresh = await readCase(id)
      if (!fresh) return
      setCaseData(fresh)
      if (fresh.status === 'DECIDED' || fresh.status === 'FINAL') {
        setAwaitingJudgment(false)
      }
    }, 15000)
    return () => clearInterval(timer)
  }, [awaitingJudgment, id])

  async function doAction(action: string, fn: () => Promise<string>, caseIdForStorage?: string) {
    setActiveAction(action)
    setActionError(null)
    const isJudgmentAction = action === 'judgment' || action === 'appeal-judgment'
    try {
      const hash = await fn()
      if (isJudgmentAction) {
        // Save tx hash so ValidatorConsensusPanel can fetch consensus data later
        if (typeof window !== 'undefined' && caseIdForStorage) {
          const key = action === 'appeal-judgment'
            ? `cjp_appeal_tx_${caseIdForStorage}`
            : `cjp_judgment_tx_${caseIdForStorage}`
          localStorage.setItem(key, hash)
        }
        setAwaitingJudgment(true)
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
  const evidenceRefs: string[] = Array.isArray(c.evidence_refs) ? c.evidence_refs : []
  const policyUrl: string = c.policy_url ?? ''

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
        <Link href="/cases" style={{ color: 'var(--color-primary-light)' }}>Cases</Link>
        <span>/</span>
        <span className="font-mono">#{id.slice(-8)}</span>
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
            { label: 'Filed by', value: `${c.filer.slice(0, 6)}…${c.filer.slice(-4)}`, mono: true },
            c.matric_number ? { label: 'Matric', value: c.matric_number, mono: true } : null,
            c.department ? { label: 'Department', value: c.department } : null,
            { label: 'Filed', value: (() => { const n = Number(c.filed_at); return n > 946684800000 ? new Date(n).toLocaleDateString() : c.filed_at })() },
          ] as Array<{ label: string; value: string; mono?: boolean } | null>)
            .filter((x): x is { label: string; value: string; mono?: boolean } => !!x)
            .map(item => (
              <div key={item.label} className="p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>{item.label}</p>
                <p className={`text-xs font-medium ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
              </div>
          ))}
        </div>

        {evidenceRefs.length > 0 && (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Evidence</p>
            <div className="space-y-1">
              {evidenceRefs.map((ref, i) => {
                const isUrl = ref.startsWith('http://') || ref.startsWith('https://')
                return (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg"
                    style={{ background: isUrl ? 'rgba(74,222,128,0.05)' : 'rgba(124,58,237,0.06)', color: isUrl ? '#4ade80' : 'var(--color-primary-light)', border: `1px solid ${isUrl ? 'rgba(74,222,128,0.15)' : 'var(--color-border)'}` }}>
                    <span>{isUrl ? '🌐' : '📄'}</span>
                    <span className="truncate flex-1">{ref}</span>
                    {isUrl && <span className="shrink-0 opacity-60" style={{ fontFamily: 'sans-serif' }}>live fetch</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {policyUrl && (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Institution Policy Document</p>
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.06)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
              <span>📋</span>
              <span className="truncate flex-1">{policyUrl}</span>
              <span className="shrink-0 opacity-60" style={{ fontFamily: 'sans-serif' }}>live fetch</span>
            </div>
          </div>
        )}
      </div>

      {/* Response */}
      {c.response_text && (
        <div className="gl-card p-6 space-y-2">
          <p className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>Institution Response</p>
          <p className="text-sm leading-relaxed">{c.response_text}</p>
        </div>
      )}

      {/* Judgment */}
      {c.judgment && <JudgmentPanel judgment={c.judgment} />}
      {c.judgment && <ValidatorConsensusPanel caseId={c.case_id} />}
      {c.final_judgment && <JudgmentPanel judgment={c.final_judgment} isAppeal />}
      {c.final_judgment && <ValidatorConsensusPanel caseId={c.case_id} isAppeal />}

      {/* ── Action Room ───────────────────────────────────────────────────────── */}

      {/* Process timeline — shown for active cases */}
      {!['DECIDED', 'FINAL'].includes(c.status) && !awaitingJudgment && (
        <div className="gl-card p-6">
          <p className="text-xs font-semibold mb-4" style={{ color: 'var(--color-muted)' }}>Case Progress</p>
          <div className="flex items-start gap-0">
            {[
              { key: 'SUBMITTED', label: 'Case Filed', done: true },
              { key: 'RESPONDED', label: 'Institution Responds', done: ['RESPONDED', 'DELIBERATING'].includes(c.status) },
              { key: 'DELIBERATING', label: 'AI Judgment', done: false },
              { key: 'DECIDED', label: 'Decision', done: false },
            ].map((step, i, arr) => (
              <div key={step.key} className="flex-1 flex flex-col items-center">
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
                <p className="text-xs mt-1.5 text-center leading-tight" style={{ color: step.done ? 'var(--color-primary-light)' : 'var(--color-muted)' }}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Room — open for institution response */}
      {c.status === 'SUBMITTED' && !c.response_text && (
        <div className="gl-card overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" style={{ boxShadow: '0 0 6px #4ade80' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>Action Room — Open for Institution Response</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
              Awaiting Response
            </span>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              This case is now open. The institution should review the complaint and submit an official response before AI judgment is requested.
            </p>

            {/* Not connected */}
            {!connected && (
              <div className="p-4 rounded-lg space-y-1" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)' }}>
                <p className="text-sm font-medium">Institution: connect your wallet to respond</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Switch to your institution wallet in MetaMask, then click <strong>Connect Wallet</strong> in the top-right corner.
                </p>
              </div>
            )}

            {/* Connected as institution (not filer) */}
            {connected && !isFiler && (
              <div className="space-y-3">
                <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Submit official institution response</p>
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  rows={6}
                  placeholder="Address the complaint directly. Reference relevant policies, records, or procedures. Minimum 30 characters."
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                />
                {actionError && (
                  <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
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
            )}

            {/* Connected as filer — waiting for institution */}
            {connected && isFiler && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)' }}>
                  <p className="text-sm font-medium mb-1">Waiting for institution response</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Share the case link with the institution so they can connect their wallet and submit a response. You can request AI judgment once they respond — or skip directly if no response is expected.
                  </p>
                </div>
                <button
                  onClick={() => doAction('judgment', () => requestJudgment(c.case_id), c.case_id)}
                  disabled={txPending}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)', opacity: txPending ? 0.6 : 1 }}
                >
                  {activeAction === 'judgment' && <span className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full spin inline-block mr-2" />}
                  Skip to AI Judgment (no response yet)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Room — responded, ready for judgment */}
      {c.status === 'RESPONDED' && !awaitingJudgment && (
        <div className="gl-card overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>Action Room — Ready for AI Judgment</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}>
              Both sides heard
            </span>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              The institution has submitted their response. The case is ready for AI arbitration. GenLayer validators will independently analyze both sides and reach consensus.
            </p>
            {actionError && (
              <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                {actionError}
              </div>
            )}
            {connected && isFiler && (
              <button
                onClick={() => doAction('judgment', () => requestJudgment(c.case_id), c.case_id)}
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

      {/* Deliberating — validators running */}
      {awaitingJudgment && (
        <div className="gl-card p-6 space-y-3" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 border-2 border-purple-700 border-t-purple-300 rounded-full spin shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-primary-light)' }}>Validators deliberating…</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                GenLayer validators are independently running the AI model and reaching consensus (Optimistic Democracy). This typically takes 3–15 minutes.
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                This page checks every 15 seconds. You can navigate away and return — the judgment will be here once finalized.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              const fresh = await readCase(id)
              if (fresh) {
                setCaseData(fresh)
                if (fresh.status === 'DECIDED' || fresh.status === 'FINAL') setAwaitingJudgment(false)
              }
            }}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}
          >
            Check now
          </button>
        </div>
      )}

      {/* Appeal room */}
      {connected && (
        <>
          {c.status === 'DECIDED' && isFiler && !c.appeal && (
            <div className="gl-card overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.2)' }}>
              <div className="px-6 py-4" style={{ background: 'rgba(124,58,237,0.06)', borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>Appeal Room</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Disagree with the judgment? File an appeal with your grounds.</p>
              </div>
              <div className="p-6 space-y-3">
                {actionError && (
                  <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                    {actionError}
                  </div>
                )}
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  rows={4}
                  placeholder="Explain why this judgment should be reconsidered. Reference specific facts, procedural errors, or overlooked evidence. Minimum 20 characters."
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

          {c.status === 'APPEALED' && isFiler && !awaitingJudgment && (
            <div className="gl-card overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
              <div className="px-6 py-4" style={{ background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>Appeal Room — Ready for Senior Review</p>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Your appeal has been filed. Request a senior AI review — validators will re-examine the full case including your appeal grounds.
                </p>
                {actionError && (
                  <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                    {actionError}
                  </div>
                )}
                <button
                  onClick={() => doAction('appeal-judgment', () => requestAppealJudgment(c.case_id), c.case_id)}
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
        </>
      )}
    </div>
  )
}
