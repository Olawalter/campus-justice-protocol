'use client'

import { Badge } from '@/components/ui/badge'
import { CaseStatus } from '@/types'
import { formatCaseStatus } from '@/utils/format'
import { cn } from '@/utils/cn'

const statusConfig: Record<CaseStatus, { variant: string; className: string }> = {
  SUBMITTED:             { variant: 'outline', className: 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400' },
  VERIFIED:             { variant: 'outline', className: 'border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400' },
  INSTITUTION_NOTIFIED: { variant: 'outline', className: 'border-violet-300 text-violet-600 dark:border-violet-700 dark:text-violet-400' },
  RESPONDED:            { variant: 'outline', className: 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400' },
  DELIBERATING:         { variant: 'outline', className: 'border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400 animate-pulse' },
  JUDGMENT_ISSUED:      { variant: 'outline', className: 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400' },
  APPEALED:             { variant: 'outline', className: 'border-rose-300 text-rose-600 dark:border-rose-700 dark:text-rose-400' },
  FINAL_JUDGMENT:       { variant: 'outline', className: 'border-emerald-400 text-emerald-700 dark:border-emerald-600 dark:text-emerald-300 font-semibold' },
  CLOSED:               { variant: 'secondary', className: 'bg-muted text-muted-foreground' },
}

interface CaseStatusBadgeProps {
  status: CaseStatus
  className?: string
}

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.SUBMITTED
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', config.className, className)}
    >
      {formatCaseStatus(status)}
    </Badge>
  )
}
