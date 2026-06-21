'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { InstitutionProfile } from '@/types'
import { getInstitutionProfile } from '@/services/genlayer/contract'
import { Skeleton } from '@/components/ui/skeleton'

interface InstitutionReputationPanelProps {
  institutionAddress: string
  institutionName?: string
}

export function InstitutionReputationPanel({
  institutionAddress,
  institutionName,
}: InstitutionReputationPanelProps) {
  const [profile, setProfile] = useState<InstitutionProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!institutionAddress || !institutionAddress.startsWith('0x')) {
      setLoading(false)
      return
    }
    getInstitutionProfile(institutionAddress)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [institutionAddress])

  if (loading) return <Skeleton className="h-44 rounded-xl" />
  if (!profile) return null

  const resolutionRate =
    profile.totalCases > 0
      ? Math.round((profile.resolvedCases / profile.totalCases) * 100)
      : 0
  const reputationPct = Math.round(profile.reputationScore * 100)
  const scoreColor =
    reputationPct >= 75 ? '#10B981' : reputationPct >= 50 ? '#F59E0B' : '#EF4444'
  const circumference = 2 * Math.PI * 14

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <Star className="h-3.5 w-3.5 text-violet-500" />
        </div>
        <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Institution Reputation
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Score ring */}
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18" cy="18" r="14"
              fill="none"
              className="stroke-muted"
              strokeWidth="3"
            />
            <motion.circle
              cx="18" cy="18" r="14"
              fill="none"
              stroke={scoreColor}
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{
                strokeDasharray: `${(reputationPct / 100) * circumference} ${circumference}`,
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold" style={{ color: scoreColor }}>
              {reputationPct}%
            </span>
          </div>
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {profile.name || institutionName || 'Institution'}
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              {resolutionRate}% resolved
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-500 shrink-0" />
              {profile.totalCases} cases
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500 shrink-0" />
              {profile.avgResolutionDays}d avg
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-violet-500 shrink-0" />
              {Math.round(profile.appealSuccessRate * 100)}% appeal rate
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
