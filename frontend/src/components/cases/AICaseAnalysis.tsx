'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, ChevronDown, ChevronUp, AlertCircle, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { AnalysisResult } from '@/app/api/analyze-case/route'

interface Props {
  caseId: string
  disputeType: string
  description: string
  institutionName: string
  department?: string
  matricNumber?: string
  evidenceCount?: number
}

const STRENGTH_CONFIG = {
  STRONG:   { label: 'Strong Case',    color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: TrendingUp   },
  MODERATE: { label: 'Moderate Case',  color: 'text-amber-500',   bg: 'bg-amber-500/10 border-amber-500/30',     icon: Minus        },
  WEAK:     { label: 'Weak Case',      color: 'text-red-500',     bg: 'bg-red-500/10 border-red-500/30',         icon: TrendingDown },
}

const OUTCOME_CONFIG = {
  UPHELD:         { label: 'Likely Upheld',        color: 'text-emerald-500', dot: 'bg-emerald-500' },
  REJECTED:       { label: 'Likely Rejected',      color: 'text-red-500',     dot: 'bg-red-500'     },
  FURTHER_REVIEW: { label: 'Needs Further Review', color: 'text-amber-500',   dot: 'bg-amber-500'   },
}

export function AICaseAnalysis({ caseId, disputeType, description, institutionName, department, matricNumber, evidenceCount }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (!description || description.length < 10) {
      setLoading(false)
      return
    }
    fetch('/api/analyze-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, disputeType, description, institutionName, department, matricNumber, evidenceCount }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setAnalysis(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [caseId, disputeType, description, institutionName, department, matricNumber, evidenceCount])

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Brain className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Case Analysis</p>
            <p className="text-xs text-muted-foreground">Preliminary assessment by Claude</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {analysis && !loading && (
            <span className={cn('text-xs font-medium', STRENGTH_CONFIG[analysis.strengthAssessment].color)}>
              {STRENGTH_CONFIG[analysis.strengthAssessment].label}
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {loading && (
            <div className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
              Analyzing case with Claude AI…
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {analysis && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 space-y-5"
            >
              {/* Top row — strength + outcome + confidence */}
              <div className="grid grid-cols-3 gap-3">
                {(() => {
                  const s = STRENGTH_CONFIG[analysis.strengthAssessment]
                  const Icon = s.icon
                  return (
                    <div className={cn('rounded-lg border p-3', s.bg)}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className={cn('h-3.5 w-3.5', s.color)} />
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Strength</p>
                      </div>
                      <p className={cn('text-sm font-semibold', s.color)}>{s.label}</p>
                    </div>
                  )
                })()}

                {(() => {
                  const o = OUTCOME_CONFIG[analysis.recommendedOutcome]
                  return (
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Likely Outcome</p>
                      <div className="flex items-center gap-1.5">
                        <div className={cn('w-2 h-2 rounded-full', o.dot)} />
                        <p className={cn('text-sm font-semibold', o.color)}>{o.label}</p>
                      </div>
                    </div>
                  )
                })()}

                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">AI Confidence</p>
                  <div className="flex items-end gap-1.5">
                    <p className="text-sm font-semibold text-foreground">{Math.round(analysis.confidenceScore * 100)}%</p>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.confidenceScore * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Case Summary</p>
                <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Key Issues */}
              {analysis.keyIssues.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Key Issues Identified</p>
                  <ul className="space-y-1.5">
                    {analysis.keyIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reasoning */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">AI Reasoning</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.reasoning}</p>
              </div>

              {/* Suggested Actions */}
              {analysis.suggestedActions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Suggested Next Steps</p>
                  <ul className="space-y-1.5">
                    {analysis.suggestedActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground bg-muted/40 rounded-lg px-3 py-2">
                        <span className="text-violet-500 font-bold shrink-0">{i + 1}.</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground/60 border-t border-border pt-3">
                This is a preliminary AI assessment by Claude (claude-haiku-4-5). It is advisory only and does not constitute a final judgment. The GenLayer validator network provides the binding verdict.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
