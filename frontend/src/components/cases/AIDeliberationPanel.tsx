'use client'

import { motion } from 'framer-motion'
import { Brain, RefreshCw, CheckCircle2, XCircle, AlertCircle, Scale, Network, Cpu } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'

interface JudgmentData {
  outcome: string
  reasoning: string
  evidenceSummary: string
  confidenceScore: number
  issuedAt?: number
}

interface AIDeliberationPanelProps {
  status: string
  judgment?: JudgmentData
  isAppeal?: boolean
}

const OUTCOME_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  UPHELD:                 { label: 'Case Upheld',              color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-400/30', icon: CheckCircle2 },
  REJECTED:               { label: 'Case Rejected',            color: 'text-red-500',                           bg: 'bg-red-500/10 border-red-400/30',           icon: XCircle      },
  FURTHER_REVIEW:         { label: 'Further Review Needed',    color: 'text-amber-500',                         bg: 'bg-amber-500/10 border-amber-400/30',       icon: AlertCircle  },
  SETTLEMENT_RECOMMENDED: { label: 'Settlement Recommended',   color: 'text-blue-500',                          bg: 'bg-blue-500/10 border-blue-400/30',         icon: Scale        },
}

export function AIDeliberationPanel({ status, judgment, isAppeal }: AIDeliberationPanelProps) {
  const isDeliberating = status === 'DELIBERATING'
  const hasJudgment = !!judgment
  const outcomeConfig = judgment ? (OUTCOME_CONFIG[judgment.outcome] ?? OUTCOME_CONFIG['FURTHER_REVIEW']) : null
  const OutcomeIcon = outcomeConfig?.icon

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Brain className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {isAppeal ? 'Appeal Judgment' : 'AI Judgment'}
          </h2>
        </div>
        {isDeliberating && !hasJudgment && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Validators deliberating…
          </div>
        )}
        {hasJudgment && (
          <Badge className="bg-violet-500/10 text-violet-600 border-violet-300 text-xs">
            Judgment Issued
          </Badge>
        )}
      </div>

      {isDeliberating && !hasJudgment && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            GenLayer validators are independently running AI analysis on this case using{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">gl.nondet.exec_prompt</code>.
            The{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">gl.eq_principle.prompt_comparative</code>{' '}
            wrapper ensures validators reach consensus before the judgment is written to the chain.
          </p>
          <div className="flex gap-1.5 pt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="flex-1 h-2 rounded-full bg-violet-200 dark:bg-violet-900/40"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.32 }}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1"><Network className="h-3 w-3" /> 5 validator nodes</span>
            <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> LLM prompt per node</span>
          </div>
        </div>
      )}

      {hasJudgment && outcomeConfig && OutcomeIcon && (
        <div className="space-y-4">
          {/* Outcome badge */}
          <div className={cn('flex items-center gap-2.5 rounded-lg border px-4 py-3', outcomeConfig.bg)}>
            <OutcomeIcon className={cn('h-5 w-5 shrink-0', outcomeConfig.color)} />
            <div>
              <p className={cn('text-sm font-semibold', outcomeConfig.color)}>{outcomeConfig.label}</p>
              <p className="text-xs text-muted-foreground">
                Confidence: {Math.round(judgment!.confidenceScore * 100)}%
              </p>
            </div>
            <div className="ml-auto">
              <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${judgment!.confidenceScore * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Evidence summary */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Evidence Considered</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{judgment!.evidenceSummary}</p>
          </div>

          {/* Reasoning */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">AI Arbitrator Reasoning</p>
            <p className="text-sm text-foreground leading-relaxed">{judgment!.reasoning}</p>
          </div>

          {judgment!.issuedAt && (
            <p className="text-xs text-muted-foreground">
              Issued: {new Date(judgment!.issuedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {!isDeliberating && !hasJudgment && (
        <p className="text-sm text-muted-foreground">
          AI judgment begins after the institution responds and the admin triggers evaluation.
          The GenLayer validator network will run an AI prompt on each node using{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">gl.nondet.exec_prompt</code>{' '}
          and reach consensus via{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">gl.eq_principle.prompt_comparative</code>{' '}
          before writing the binding verdict on-chain.
        </p>
      )}

      <div className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 pt-1 border-t border-border">
        <Network className="h-3 w-3" />
        <span>
          On-chain AI via GenLayer —{' '}
          <code className="font-mono">gl.nondet.exec_prompt</code> +{' '}
          <code className="font-mono">gl.eq_principle.prompt_comparative</code>
        </span>
      </div>
    </div>
  )
}
