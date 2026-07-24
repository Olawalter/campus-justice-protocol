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

      <div className="flex items-center gap-1.5 text-xs pt-1" style={{ color: 'rgba(139,92,246,0.6)' }}>
        <span>⬡</span>
        <span>Decided via GenLayer validator consensus — Optimistic Democracy</span>
      </div>
    </div>
  )
}
