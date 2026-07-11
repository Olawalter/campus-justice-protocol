import Link from 'next/link'

// filed_at is a Unix ms timestamp string (new) or case counter string (old)
function formatFiledAt(filedAt: string): string {
  const n = Number(filedAt)
  if (!filedAt || isNaN(n)) return '—'
  // If it looks like a real timestamp (> year 2000 in ms = 946684800000)
  if (n > 946684800000) return new Date(n).toLocaleDateString()
  return `Case #${filedAt}`
}
import { Case } from '@/lib/types'
import { CASE_TYPE_META } from '@/lib/constants'
import { StatusBadge, OutcomeBadge } from '@/components/ui/StatusBadge'

interface CaseCardProps { c: Case }

export function CaseCard({ c }: CaseCardProps) {
  const meta = CASE_TYPE_META[c.case_type] ?? { label: c.case_type, icon: '📄', description: '' }
  const hasJudgment = c.status === 'DECIDED' || c.status === 'FINAL'

  return (
    <Link href={`/cases/${c.case_id}`}>
      <div
        className="gl-card p-5 transition-all cursor-pointer"
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{meta.icon}</span>
            <div className="min-w-0">
              <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>{meta.label}</p>
              <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{c.title}</h3>
            </div>
          </div>
          <StatusBadge status={c.status} />
        </div>

        <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--color-muted)' }}>
          {c.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasJudgment && c.judgment?.outcome && (
              <OutcomeBadge outcome={c.judgment.outcome} />
            )}
            {hasJudgment && c.judgment?.confidence != null && (
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {Math.round(c.judgment.confidence * 100)}% confidence
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-muted)' }}>
            <span className="font-mono">#{c.case_id.slice(-6)}</span>
            <span>{formatFiledAt(c.filed_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
