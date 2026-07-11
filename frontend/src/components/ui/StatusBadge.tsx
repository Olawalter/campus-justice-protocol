import { STATUS_META, OUTCOME_META } from '@/lib/constants'

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: '#94A3B8' }
  const isDeliberating = status === 'DELIBERATING'

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${isDeliberating ? 'deliberating-pulse' : ''}`}
      style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}33` }}
    >
      {isDeliberating && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: meta.color }} />}
      {meta.label}
    </span>
  )
}

export function OutcomeBadge({ outcome }: { outcome: string }) {
  const meta = OUTCOME_META[outcome] ?? { label: outcome, color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' }
  const icons: Record<string, string> = {
    UPHELD: '✓',
    DISMISSED: '✕',
    PARTIAL: '◑',
    INCONCLUSIVE: '?',
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}44` }}
    >
      <span>{icons[outcome] ?? '•'}</span>
      {meta.label}
    </span>
  )
}
