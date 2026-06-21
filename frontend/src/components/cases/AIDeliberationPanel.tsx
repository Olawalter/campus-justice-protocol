'use client'

import { motion } from 'framer-motion'
import { Users, Vote, RefreshCw, CheckCircle2, Brain } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ValidatorConsensus } from '@/types'

interface AIDeliberationPanelProps {
  status: string
  consensus?: ValidatorConsensus
}

export function AIDeliberationPanel({ status, consensus }: AIDeliberationPanelProps) {
  const isDeliberating = status === 'DELIBERATING'
  const hasConsensus = !!consensus

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Brain className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            AI Deliberation
          </h2>
        </div>
        {isDeliberating && !hasConsensus && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <RefreshCw className="h-3 w-3 animate-spin" />
            In progress
          </div>
        )}
        {hasConsensus && consensus!.consensusReached && (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 text-xs">
            Consensus Reached
          </Badge>
        )}
      </div>

      {isDeliberating && !hasConsensus && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The GenLayer validator network is deliberating your case using AI reasoning across 5 independent nodes.
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
        </div>
      )}

      {hasConsensus && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-lg font-heading font-bold text-foreground">
                {consensus!.totalValidators}
              </p>
              <p className="text-xs text-muted-foreground">Validators</p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-3">
              <p className="text-lg font-heading font-bold text-emerald-600">
                {consensus!.agreeingValidators}
              </p>
              <p className="text-xs text-muted-foreground">Agreed</p>
            </div>
            <div className="bg-rose-500/10 rounded-lg p-3">
              <p className="text-lg font-heading font-bold text-rose-500">
                {consensus!.totalValidators - consensus!.agreeingValidators}
              </p>
              <p className="text-xs text-muted-foreground">Dissented</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Agreement rate</span>
              <span className="font-medium">
                {Math.round((consensus!.agreeingValidators / consensus!.totalValidators) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(consensus!.agreeingValidators / consensus!.totalValidators) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Vote className="h-3 w-3" />
              {consensus!.rounds} deliberation round{consensus!.rounds !== 1 ? 's' : ''}
            </span>
            {consensus!.consensusReached && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Consensus achieved
              </span>
            )}
          </div>
        </div>
      )}

      {!isDeliberating && !hasConsensus && (
        <p className="text-sm text-muted-foreground">
          AI deliberation begins after the institution responds and the admin triggers evaluation. Five validator nodes will independently analyze all evidence before reaching consensus.
        </p>
      )}

      <div className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 pt-1 border-t border-border">
        <Users className="h-3 w-3" />
        <span>Powered by GenLayer decentralized validator network</span>
      </div>
    </div>
  )
}
