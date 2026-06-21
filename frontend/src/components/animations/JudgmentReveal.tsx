'use client'

import { motion } from 'framer-motion'
import { Scale, TrendingUp, FileText } from 'lucide-react'
import { JudgmentOutcome } from '@/types'
import { formatOutcome, formatConfidence } from '@/utils/format'
import { cn } from '@/utils/cn'

const outcomeStyles: Record<JudgmentOutcome, { color: string; bg: string; border: string }> = {
  UPHELD: {
    color: '#10B981',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  REJECTED: {
    color: '#EF4444',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
  },
  FURTHER_REVIEW: {
    color: '#F59E0B',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  SETTLEMENT_RECOMMENDED: {
    color: '#2563EB',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
}

interface JudgmentRevealProps {
  outcome: JudgmentOutcome
  confidenceScore: number
  reasoning: string
  evidenceSummary?: string
  className?: string
}

export function JudgmentReveal({
  outcome,
  confidenceScore,
  reasoning,
  evidenceSummary,
  className,
}: JudgmentRevealProps) {
  const style = outcomeStyles[outcome]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn('space-y-4', className)}
    >
      {/* Verdict */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className={cn(
          'rounded-xl border-2 p-5 text-center',
          style.bg,
          style.border
        )}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Scale className="h-5 w-5" style={{ color: style.color }} />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Judgment
          </span>
        </div>
        <motion.h3
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="font-judgment text-2xl font-bold"
          style={{ color: style.color }}
        >
          {formatOutcome(outcome)}
        </motion.h3>
      </motion.div>

      {/* Confidence score */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card"
      >
        <TrendingUp className="h-4 w-4 text-secondary shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Confidence Score</span>
            <span className="font-semibold" style={{ color: style.color }}>
              {formatConfidence(confidenceScore)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidenceScore * 100}%` }}
              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: style.color }}
            />
          </div>
        </div>
      </motion.div>

      {/* Reasoning */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55 }}
        className="p-4 rounded-lg border border-border bg-card space-y-2"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
          <FileText className="h-4 w-4" />
          Reasoning
        </div>
        <p className="font-judgment text-sm leading-relaxed text-foreground">
          {reasoning}
        </p>
        {evidenceSummary && (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            {evidenceSummary}
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
