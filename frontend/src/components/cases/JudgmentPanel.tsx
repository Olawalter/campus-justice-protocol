'use client'

import { Judgment } from '@/lib/types'
import { OutcomeBadge } from '@/components/ui/StatusBadge'
import { ValidatorRing } from '@/components/ui/ValidatorRing'

export function JudgmentPanel({ judgment, isAppeal = false }: { judgment: Judgment; isAppeal?: boolean }) {
  return (
    <div
      className="gl-card p-6 space-y-5"
      style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(124,58,237,0.05)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-purple-400 text-lg">⚖</span>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>
          {isAppeal ? 'Appeal Judgment' : 'AI Judgment'} — Optimistic Democracy
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Outcome</p>
          <OutcomeBadge outcome={judgment.outcome} />
        </div>
        {judgment.confidence != null && (
          <div className="sm:ml-auto">
            <ValidatorRing confidence={judgment.confidence} />
          </div>
        )}
      </div>

      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Reasoning</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
          {judgment.reasoning}
        </p>
      </div>

      {judgment.key_findings?.length ? (
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Key Findings</p>
          <ul className="space-y-1.5">
            {judgment.key_findings.map((f, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--color-muted)' }}>
                <span style={{ color: 'var(--color-primary-light)' }}>›</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {judgment.audit_trail?.length ? (
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Audit Trail</p>
          <div className="space-y-1.5">
            {judgment.audit_trail.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(109,40,217,0.08)', color: 'var(--color-muted)' }}
              >
                <span className="font-mono shrink-0 opacity-50">{String(i + 1).padStart(2, '0')}</span>
                <span>{entry}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 text-xs pt-1" style={{ color: 'rgba(139,92,246,0.6)' }}>
        <span>⬡</span>
        <span>Decided via GenLayer validator consensus{judgment.decided_at && !isNaN(new Date(judgment.decided_at).getTime()) ? ` · ${new Date(judgment.decided_at).toLocaleString()}` : ''}</span>
      </div>
    </div>
  )
}
