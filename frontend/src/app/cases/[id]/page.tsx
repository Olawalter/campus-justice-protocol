'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Case } from '@/lib/types'
import { readCase } from '@/lib/genlayer'
import { useWallet } from '@/contexts/WalletContext'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { JudgmentPanel } from '@/components/cases/JudgmentPanel'
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

  async function doAction(action: string, fn: () => Promise<string>) {
    setActiveAction(action)
    setActionError(null)
    const isJudgmentAction = action === 'judgment' || action === 'appeal-judgment'
    try {
      await fn()
      if (isJudgmentAction) {
        // Tx submitted but LLM consensus takes minutes — poll until DECIDED
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
  const evidenceRefs: string[] = (() => { try { return JSON.parse(c.evidence_refs || '[]') } catch { return [] } })()

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
              {evidenceRefs.map((ref, i) => (
                <div key={i} className="text-xs font-mono px-3 py-1.5 rounded-lg truncate"
                  style={{ background: 'rgba(124,58,237,0.06)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}>
                  {ref}
                </div>
              ))}
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
      {c.final_judgment && <JudgmentPanel judgment={c.final_judgment} isAppeal />}

      {/* Actions */}
      {connected && (
        <div className="gl-card p-6 space-y-4">
          <p className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>Actions</p>

          {actionError && (
            <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
              {actionError}
            </div>
          )}

          {/* Deliberating state — validators are running LLM consensus */}
          {awaitingJudgment && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid var(--color-border)' }}>
                <div className="w-5 h-5 border-2 border-purple-700 border-t-purple-300 rounded-full spin shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-primary-light)' }}>Validators deliberating…</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                    GenLayer validators are independently running the AI model and reaching consensus (Optimistic Democracy). This typically takes 3–15 minutes depending on network load.
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                    This page checks every 15 seconds. You can also navigate away and return later — the judgment will be here once finalized.
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

          {/* Submit response */}
          {c.status === 'SUBMITTED' && !c.response_text && !isFiler && (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Submit your response to this case</p>
              <textarea
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                rows={4}
                placeholder="Your response…"
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
              />
              <button
                onClick={() => doAction('response', () => submitResponse(c.case_id, responseText))}
                disabled={txPending || !responseText}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-primary)', color: '#fff', opacity: (txPending || !responseText) ? 0.6 : 1 }}
              >
                {activeAction === 'response' ? 'Submitting…' : 'Submit Response'}
              </button>
            </div>
          )}

          {/* Request judgment */}
          {(c.status === 'SUBMITTED' || c.status === 'RESPONDED') && isFiler && !awaitingJudgment && (
            <button
              onClick={() => doAction('judgment', () => requestJudgment(c.case_id))}
              disabled={txPending}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ background: 'var(--color-primary)', color: '#fff', opacity: txPending ? 0.6 : 1 }}
            >
              {activeAction === 'judgment' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin" />}
              Request AI Judgment
            </button>
          )}

          {/* File appeal */}
          {c.status === 'DECIDED' && isFiler && !c.appeal && (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Grounds for appeal</p>
              <textarea
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                rows={3}
                placeholder="Explain why this judgment should be reconsidered…"
                value={appealGrounds}
                onChange={e => setAppealGrounds(e.target.value)}
              />
              <button
                onClick={() => doAction('appeal', () => fileAppeal(c.case_id, appealGrounds))}
                disabled={txPending || !appealGrounds}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}
              >
                {activeAction === 'appeal' ? 'Filing…' : 'File Appeal'}
              </button>
            </div>
          )}

          {/* Request appeal judgment */}
          {c.status === 'APPEALED' && isFiler && !awaitingJudgment && (
            <button
              onClick={() => doAction('appeal-judgment', () => requestAppealJudgment(c.case_id))}
              disabled={txPending}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ background: 'var(--color-primary)', color: '#fff', opacity: txPending ? 0.6 : 1 }}
            >
              {activeAction === 'appeal-judgment' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin" />}
              Request Appeal Judgment
            </button>
          )}
        </div>
      )}
    </div>
  )
}
