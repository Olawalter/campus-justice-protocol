'use client'

import { useState } from 'react'
import { Case, EvidenceItem } from '@/lib/types'
import { useWallet } from '@/contexts/WalletContext'

function DeadlineCountdown({ deadline }: { deadline: number }) {
  const now = Math.floor(Date.now() / 1000)
  const remaining = deadline - now
  if (remaining <= 0) return <span style={{ color: '#f87171' }}>Closed</span>
  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const mins = Math.floor((remaining % 3600) / 60)
  if (days > 0) return <span style={{ color: '#4ade80' }}>{days}d {hours}h remaining</span>
  if (hours > 0) return <span style={{ color: '#fbbf24' }}>{hours}h {mins}m remaining</span>
  return <span style={{ color: '#f87171' }}>{mins}m remaining</span>
}

function EvidenceList({ items, label, accentColor }: { items: EvidenceItem[]; label: string; accentColor: string }) {
  if (items.length === 0) return (
    <p className="text-xs italic" style={{ color: 'var(--color-muted)' }}>No evidence submitted yet.</p>
  )
  return (
    <div className="space-y-2">
      {items.map((ev, i) => {
        const isUrl = ev.url.startsWith('http://') || ev.url.startsWith('https://')
        return (
          <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
            <span style={{ color: accentColor, flexShrink: 0, marginTop: 1 }}>{isUrl ? '🌐' : '📄'}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate" style={{ color: accentColor }}>{ev.description || ev.url}</p>
              {ev.description && ev.url !== ev.description && (
                <p className="font-mono truncate mt-0.5 opacity-70" style={{ color: accentColor }}>{ev.url}</p>
              )}
              {isUrl && <p className="opacity-50 mt-0.5" style={{ fontFamily: 'sans-serif' }}>live fetch at judgment time</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  caseData: Case
  onRefresh: () => void
}

export function EvidencePanel({ caseData: c, onRefresh }: Props) {
  const { address, connected, submitEvidence, txPending } = useWallet()
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const now = Math.floor(Date.now() / 1000)
  const deadlinePassed = now >= c.evidence_deadline
  const isFiler = address?.toLowerCase() === c.filer.toLowerCase()
  const isRespondent = address?.toLowerCase() === c.respondent.toLowerCase()
  const canSubmit = connected && (isFiler || isRespondent) && !deadlinePassed &&
    ['SUBMITTED', 'RESPONDED'].includes(c.status)

  const myItems = isFiler ? c.filer_evidence : isRespondent ? c.respondent_evidence : []
  const atLimit = myItems.length >= 5

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setError(null)
    setSubmitting(true)
    try {
      await submitEvidence(c.case_id, url.trim(), description.trim())
      setUrl('')
      setDescription('')
      await onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="gl-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>Evidence</p>
        <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Window: <DeadlineCountdown deadline={c.evidence_deadline} />
        </div>
      </div>

      {/* Filer evidence */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>
          Student Evidence ({c.filer_evidence.length}/5)
        </p>
        <EvidenceList items={c.filer_evidence} label="Student" accentColor="#4ade80" />
      </div>

      {/* Respondent evidence */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>
          Institution Evidence ({c.respondent_evidence.length}/5)
        </p>
        <EvidenceList items={c.respondent_evidence} label="Institution" accentColor="#60a5fa" />
      </div>

      {/* Submission form */}
      {canSubmit && !atLimit && (
        <form onSubmit={handleSubmit} className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-xs font-medium pt-3" style={{ color: 'var(--color-primary-light)' }}>
            Submit Evidence {isFiler ? '(as Student)' : '(as Institution)'}
          </p>
          <div>
            <input
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="https://… URL or evidence reference"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="Brief description (e.g. Exam invigilator report)"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          {error && (
            <div className="p-3 rounded-lg text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || txPending || !url.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ background: 'var(--color-primary)', color: '#fff', opacity: (submitting || txPending || !url.trim()) ? 0.6 : 1 }}
          >
            {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full spin" />}
            {submitting ? 'Submitting…' : 'Add Evidence'}
          </button>
        </form>
      )}

      {canSubmit && atLimit && (
        <p className="text-xs pt-2" style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
          Maximum 5 evidence items reached for your side.
        </p>
      )}

      {deadlinePassed && (
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Evidence window closed. Submitted evidence will be fetched live by validators at judgment time.
        </p>
      )}

      {connected && !isFiler && !isRespondent && (
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          You are not a party to this case. Connect as the student or institution wallet to submit evidence.
        </p>
      )}

      {!connected && (
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Connect your wallet to submit evidence.
        </p>
      )}
    </div>
  )
}
