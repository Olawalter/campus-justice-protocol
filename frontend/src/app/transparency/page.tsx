'use client'

import { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, Scale, Building2, FileCheck, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'
import { TransparencyStats, InstitutionProfile } from '@/types'
import { formatAddress } from '@/utils/format'
import * as contract from '@/services/genlayer/contract'

function StatCard({ label, value, sub, icon: Icon, color = '#2563EB' }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color?: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '18' }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function TransparencyContent() {
  const { user } = useAuth()
  const [stats, setStats] = useState<TransparencyStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<InstitutionProfile[]>([])
  const [loading, setLoading] = useState(true)

  const role = user?.role === 'STUDENT' ? 'student' : user?.role === 'INSTITUTION' ? 'institution' : 'admin'

  async function load() {
    setLoading(true)
    try {
      const [s, lb] = await Promise.all([
        contract.getTransparencyStats().catch(() => null),
        contract.getInstitutionLeaderboard().catch(() => [] as InstitutionProfile[]),
      ])
      setStats(s)
      setLeaderboard(lb)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <PageWrapper role={role} userName={user?.displayName}>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Transparency</h1>
            <p className="text-muted-foreground mt-1">Live on-chain stats from the GenLayer contract.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Total Cases" value={stats.total_cases} icon={Scale} color="#2563EB" />
            <StatCard label="Resolved" value={stats.resolved_cases} sub={`${stats.pending_cases} pending`} icon={FileCheck} color="#10B981" />
            <StatCard label="In Deliberation" value={stats.deliberating_cases} icon={BarChart3} color="#F59E0B" />
            <StatCard label="Appeal Rate" value={`${(stats.appeal_rate * 100).toFixed(1)}%`} icon={TrendingUp} color="#8B5CF6" />
            <StatCard label="Upheld Rate" value={`${(stats.upheld_rate * 100).toFixed(1)}%`} sub={`Rejected: ${(stats.rejected_rate * 100).toFixed(1)}%`} icon={Scale} color="#EC4899" />
            <StatCard label="Institutions" value={`${stats.verified_institutions} / ${stats.institution_count}`} sub="verified" icon={Building2} color="#0891B2" />
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Unable to load stats from contract.</p>
          </div>
        )}

        {/* Institution leaderboard */}
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-4">Institution Leaderboard</h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No institution data yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((inst, idx) => (
                <div key={inst.address} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <span className="text-lg font-heading font-bold text-muted-foreground w-7 text-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{inst.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{formatAddress(inst.address)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{(inst.reputationScore * 100).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">{inst.totalCases} cases</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

export default function TransparencyPage() {
  return (
    <AuthGuard>
      <TransparencyContent />
    </AuthGuard>
  )
}
