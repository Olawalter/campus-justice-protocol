import Link from 'next/link'

function formatCreatedAt(createdAt: number | undefined): string {
  if (!createdAt) return '—'
  return new Date(createdAt * 1000).toLocaleDateString()
}
import { Case } from '@/lib/types'
import { CASE_TYPE_META } from '@/lib/constants'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface CaseCardProps { c: Case }

export function CaseCard({ c }: CaseCardProps) {
  const meta = CASE_TYPE_META[c.case_type] ?? { label: c.case_type, icon: '📄', description: '' }

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

        {/* Judgment content is NOT shown here — it is only shown on the detail page
            after full receipt verification via verifyJudgmentFinality. The status
            badge above already communicates DECIDED / FINAL state. */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-muted)' }}>
            <span className="font-mono">#{c.case_id.slice(-6)}</span>
            <span>{formatCreatedAt(c.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
