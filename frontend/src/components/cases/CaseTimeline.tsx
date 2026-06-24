'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Circle, Gavel, Building2, MessageSquare, Brain, ShieldCheck, FileCheck, Lock } from 'lucide-react'
import { CaseStatus } from '@/types'
import { cn } from '@/utils/cn'

interface Step {
  status: CaseStatus
  label: string
  sublabel: string
  icon: React.ElementType
}

const STEPS: Step[] = [
  { status: 'SUBMITTED',           label: 'Submitted',            sublabel: 'Case filed on-chain',           icon: FileCheck   },
  { status: 'VERIFIED',            label: 'Verified',             sublabel: 'Admin reviewed & approved',     icon: ShieldCheck  },
  { status: 'INSTITUTION_NOTIFIED',label: 'Institution Notified', sublabel: 'Complaint sent to institution', icon: Building2   },
  { status: 'RESPONDED',           label: 'Responded',            sublabel: 'Institution submitted response', icon: MessageSquare},
  { status: 'DELIBERATING',        label: 'Deliberating',         sublabel: 'AI validators evaluating',      icon: Brain       },
  { status: 'JUDGMENT_ISSUED',     label: 'Judgment Issued',      sublabel: 'Verdict reached by AI panel',   icon: Gavel       },
  { status: 'CLOSED',              label: 'Closed',               sublabel: 'Case resolved',                 icon: Lock        },
]

const STATUS_ORDER: Record<CaseStatus, number> = {
  SUBMITTED:            0,
  VERIFIED:             1,
  INSTITUTION_NOTIFIED: 2,
  RESPONDED:            3,
  DELIBERATING:         4,
  JUDGMENT_ISSUED:      5,
  APPEALED:             5,
  FINAL_JUDGMENT:       5,
  CLOSED:               6,
}

interface CaseTimelineProps {
  currentStatus: CaseStatus
  timestamps?: Partial<Record<CaseStatus, number>>
  className?: string
  variant?: 'horizontal' | 'vertical'
}

export function CaseTimeline({ currentStatus, timestamps = {}, className, variant = 'vertical' }: CaseTimelineProps) {
  const currentIdx = STATUS_ORDER[currentStatus] ?? 0

  if (variant === 'horizontal') {
    return (
      <div className={cn('w-full', className)}>
        {/* Mobile: vertical */}
        <div className="flex flex-col gap-0 sm:hidden">
          <VerticalSteps steps={STEPS} currentIdx={currentIdx} timestamps={timestamps} currentStatus={currentStatus} />
        </div>
        {/* Desktop: horizontal */}
        <div className="hidden sm:block">
          <HorizontalSteps steps={STEPS} currentIdx={currentIdx} timestamps={timestamps} currentStatus={currentStatus} />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-0', className)}>
      <VerticalSteps steps={STEPS} currentIdx={currentIdx} timestamps={timestamps} currentStatus={currentStatus} />
    </div>
  )
}

function formatTs(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function HorizontalSteps({ steps, currentIdx, timestamps, currentStatus }: {
  steps: Step[]
  currentIdx: number
  timestamps: Partial<Record<CaseStatus, number>>
  currentStatus: CaseStatus
}) {
  return (
    <div className="relative">
      {/* connecting line */}
      <div className="absolute top-5 left-0 right-0 h-px bg-border mx-8" />
      <div
        className="absolute top-5 left-0 h-px bg-secondary mx-8 transition-all duration-700"
        style={{ width: `calc(${(currentIdx / (steps.length - 1)) * 100}% - 0px)` }}
      />

      <div className="relative flex justify-between">
        {steps.map((step, i) => {
          const done = i < currentIdx
          const active = i === currentIdx
          const pending = i > currentIdx
          const Icon = step.icon

          return (
            <motion.div
              key={step.status}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className="flex flex-col items-center gap-2"
              style={{ width: `${100 / steps.length}%` }}
            >
              {/* circle */}
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300',
                done   && 'bg-secondary border-secondary shadow-sm shadow-secondary/30',
                active && 'bg-secondary/15 border-secondary ring-4 ring-secondary/20',
                pending && 'bg-background border-border'
              )}>
                {done   && <CheckCircle2 className="h-5 w-5 text-white" />}
                {active && <Clock className="h-4 w-4 text-secondary animate-pulse" />}
                {pending && <Icon className="h-4 w-4 text-muted-foreground/40" />}
              </div>

              {/* label */}
              <div className="text-center px-1">
                <p className={cn(
                  'text-xs font-semibold leading-tight',
                  done    && 'text-foreground',
                  active  && 'text-secondary',
                  pending && 'text-muted-foreground/60'
                )}>
                  {step.label}
                </p>
                {active && (
                  <span className="inline-block mt-0.5 text-[10px] font-medium bg-secondary/15 text-secondary px-1.5 py-0.5 rounded-full">
                    In Progress
                  </span>
                )}
                {done && timestamps[step.status] && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatTs(timestamps[step.status]!)}</p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* special APPEALED banner */}
      {(currentStatus === 'APPEALED' || currentStatus === 'FINAL_JUDGMENT') && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg px-3 py-2"
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          {currentStatus === 'APPEALED' ? 'Appeal filed — awaiting re-evaluation by the validator panel' : 'Final judgment issued after appeal'}
        </motion.div>
      )}
    </div>
  )
}

function VerticalSteps({ steps, currentIdx, timestamps, currentStatus }: {
  steps: Step[]
  currentIdx: number
  timestamps: Partial<Record<CaseStatus, number>>
  currentStatus: CaseStatus
}) {
  return (
    <>
      {steps.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        const pending = i > currentIdx
        const Icon = step.icon

        return (
          <div key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2',
                  done   && 'bg-secondary border-secondary',
                  active && 'bg-secondary/15 border-secondary',
                  pending && 'bg-muted border-border'
                )}
              >
                {done   && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                {active && <Clock className="h-3 w-3 text-secondary animate-pulse" />}
                {pending && <Icon className="h-3 w-3 text-muted-foreground/40" />}
              </motion.div>
              {i < steps.length - 1 && (
                <div className={cn('w-px flex-1 min-h-[20px] my-1', done ? 'bg-secondary' : 'bg-border')} />
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 + 0.05, duration: 0.3 }}
              className="pb-4 pt-0.5 flex-1"
            >
              <div className="flex items-center gap-2">
                <p className={cn(
                  'text-sm font-medium leading-none',
                  done   && 'text-foreground',
                  active && 'text-secondary font-semibold',
                  pending && 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
                {active && (
                  <span className="text-[10px] font-medium bg-secondary/15 text-secondary px-1.5 py-0.5 rounded-full">
                    In Progress
                  </span>
                )}
              </div>
              <p className={cn(
                'text-xs mt-0.5',
                active ? 'text-muted-foreground' : 'text-muted-foreground/60'
              )}>
                {active ? step.sublabel : done ? step.sublabel : '—'}
              </p>
              {done && timestamps[step.status] && (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatTs(timestamps[step.status]!)}</p>
              )}
            </motion.div>
          </div>
        )
      })}

      {(currentStatus === 'APPEALED' || currentStatus === 'FINAL_JUDGMENT') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg px-3 py-2 mt-1"
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          {currentStatus === 'APPEALED' ? 'Appeal in review' : 'Final judgment after appeal'}
        </motion.div>
      )}
    </>
  )
}
