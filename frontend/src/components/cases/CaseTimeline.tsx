'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { CaseStatus } from '@/types'
import { formatCaseStatus } from '@/utils/format'
import { cn } from '@/utils/cn'

const TIMELINE_STEPS: CaseStatus[] = [
  'SUBMITTED',
  'VERIFIED',
  'INSTITUTION_NOTIFIED',
  'RESPONDED',
  'DELIBERATING',
  'JUDGMENT_ISSUED',
  'CLOSED',
]

function getStepIndex(status: CaseStatus): number {
  if (status === 'APPEALED') return 5
  if (status === 'FINAL_JUDGMENT') return 6
  return TIMELINE_STEPS.indexOf(status)
}

interface CaseTimelineProps {
  currentStatus: CaseStatus
  timestamps?: Partial<Record<CaseStatus, number>>
  className?: string
}

export function CaseTimeline({ currentStatus, timestamps = {}, className }: CaseTimelineProps) {
  const currentIdx = getStepIndex(currentStatus)

  return (
    <div className={cn('space-y-0', className)}>
      {TIMELINE_STEPS.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        const pending = i > currentIdx

        return (
          <div key={step} className="flex gap-3">
            {/* Connector column */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  done && 'bg-secondary',
                  active && 'bg-secondary/20 border-2 border-secondary',
                  pending && 'bg-muted border border-border'
                )}
              >
                {done && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                {active && <Clock className="h-3 w-3 text-secondary animate-pulse" />}
                {pending && <Circle className="h-3 w-3 text-muted-foreground/40" />}
              </motion.div>
              {i < TIMELINE_STEPS.length - 1 && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.08 + 0.1, duration: 0.3 }}
                  className={cn(
                    'w-px flex-1 min-h-[24px] origin-top',
                    done ? 'bg-secondary' : 'bg-border'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 + 0.05, duration: 0.3 }}
              className="pb-5 pt-0.5 flex-1"
            >
              <p
                className={cn(
                  'text-sm font-medium leading-none',
                  done && 'text-foreground',
                  active && 'text-secondary font-semibold',
                  pending && 'text-muted-foreground'
                )}
              >
                {formatCaseStatus(step)}
              </p>
              {active && (
                <p className="text-xs text-muted-foreground mt-1">In progress</p>
              )}
              {done && timestamps[step] && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(timestamps[step]! * 1000).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              )}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
