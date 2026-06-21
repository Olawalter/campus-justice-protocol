'use client'

import { Users, FolderOpen, ShieldCheck, BarChart3, Scale, TrendingUp, Globe, Library } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { StaggeredReveal, RevealItem } from '@/components/animations/StaggeredReveal'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { getCasesByStatus } from '@/services/firebase/firestore'
import { getTransparencyStats, getInstitutionLeaderboard } from '@/services/genlayer/contract'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { CaseCard } from '@/components/cases/CaseCard'
import { CaseMeta } from '@/services/firebase/firestore'
import { Badge } from '@/components/ui/badge'
import { InstitutionProfile } from '@/types'
import { formatAddress } from '@/utils/format'
import Link from 'next/link'
import { motion } from 'framer-motion'

function AdminPortalContent() {
  const { user } = useAuth()
  const [pendingCases, setPendingCases] = useState<CaseMeta[]>([])
  const [stats, setStats] = useState({
    total_cases: 0,
    resolved_cases: 0,
    pending_cases: 0,
    deliberating_cases: 0,
    institution_count: 0,
    verified_institutions: 0,
    upheld_rate: 0,
    rejected_rate: 0,
    appeal_rate: 0,
  })
  const [leaderboard, setLeaderboard] = useState<InstitutionProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [pending, transparency, lb] = await Promise.all([
          getCasesByStatus('SUBMITTED'),
          getTransparencyStats(),
          getInstitutionLeaderboard().catch(() => [] as InstitutionProfile[]),
        ])
        setPendingCases(pending)
        setStats(transparency as typeof stats)
        setLeaderboard(lb)
      } catch {
        // stats remain at defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const caseBreakdown = [
    { label: 'Pending Verify', value: pendingCases.length, color: '#F59E0B' },
    { label: 'Deliberating', value: stats.deliberating_cases, color: '#8B5CF6' },
    { label: 'Resolved', value: stats.resolved_cases, color: '#10B981' },
  ]

  return (
    <PageWrapper role="admin" userName={user?.displayName ?? 'Admin'}>
      <div className="space-y-8">
        <StaggeredReveal>
          <RevealItem>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Admin Portal</h1>
              <p className="text-muted-foreground mt-1">Platform management and oversight.</p>
            </div>
          </RevealItem>

          {/* Top metrics */}
          <RevealItem>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Total Cases" value={stats.total_cases} icon={FolderOpen} iconColor="#2563EB" delay={0} />
              <MetricCard label="Institutions" value={stats.institution_count} icon={Users} iconColor="#8B5CF6" delay={0.06} />
              <MetricCard label="Pending Verify" value={pendingCases.length} icon={ShieldCheck} iconColor="#F59E0B" delay={0.12} />
              <MetricCard label="Upheld Rate" value={Math.round(stats.upheld_rate * 100)} suffix="%" icon={BarChart3} iconColor="#10B981" delay={0.18} />
            </div>
          </RevealItem>

          {/* Analytics panels */}
          <RevealItem>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Case pipeline */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-semibold text-foreground">Case Pipeline</h2>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                {loading ? (
                  <Skeleton className="h-24 rounded-lg" />
                ) : (
                  <div className="space-y-3">
                    {caseBreakdown.map(({ label, value, color }) => (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium text-foreground">{value}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                            initial={{ width: 0 }}
                            animate={{ width: stats.total_cases > 0 ? `${(value / stats.total_cases) * 100}%` : '0%' }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Verdict distribution */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-semibold text-foreground">Verdict Distribution</h2>
                  <Scale className="h-4 w-4 text-muted-foreground" />
                </div>
                {loading ? (
                  <Skeleton className="h-24 rounded-lg" />
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: 'Upheld', value: stats.upheld_rate, color: '#10B981' },
                      { label: 'Rejected', value: stats.rejected_rate, color: '#EF4444' },
                      { label: 'Appealed', value: stats.appeal_rate, color: '#F59E0B' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium text-foreground">{(value * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${value * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Institution stats */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-semibold text-foreground">Institutions</h2>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                {loading ? (
                  <Skeleton className="h-24 rounded-lg" />
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/40 rounded-lg p-3 text-center">
                        <p className="text-xl font-heading font-bold text-foreground">{stats.institution_count}</p>
                        <p className="text-xs text-muted-foreground">Registered</p>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                        <p className="text-xl font-heading font-bold text-emerald-600">{stats.verified_institutions}</p>
                        <p className="text-xs text-muted-foreground">Verified</p>
                      </div>
                    </div>
                    {stats.institution_count > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Verification rate</span>
                          <span className="font-medium">{Math.round((stats.verified_institutions / stats.institution_count) * 100)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(stats.verified_institutions / stats.institution_count) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </RevealItem>

          {/* Institution Leaderboard */}
          {leaderboard.length > 0 && (
            <RevealItem>
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-semibold text-foreground">Institution Reputation Leaderboard</h2>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((inst, idx) => (
                    <div key={inst.address} className="flex items-center gap-4 bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-sm font-heading font-bold text-muted-foreground w-5 text-center">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{inst.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{formatAddress(inst.address)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">{Math.round(inst.reputationScore * 100)}%</p>
                        <p className="text-xs text-muted-foreground">{inst.totalCases} cases</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </RevealItem>
          )}

          {/* Quick links */}
          <RevealItem>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { href: '/admin/institutions', icon: Users, label: 'Manage Institutions', color: '#8B5CF6' },
                { href: '/admin/cases', icon: FolderOpen, label: 'All Cases', color: '#2563EB' },
                { href: '/precedents', icon: Library, label: 'Precedent Library', color: '#F59E0B' },
                { href: '/transparency', icon: Globe, label: 'Public Transparency', color: '#10B981' },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link key={href} href={href}>
                  <div className="rounded-xl border border-border bg-card p-4 hover:border-secondary/40 transition-all group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: color + '18' }}>
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-secondary transition-colors">{label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </RevealItem>

          {/* Pending verification */}
          <RevealItem>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-foreground">Pending Verification</h2>
                <Badge variant="secondary">{pendingCases.length} cases</Badge>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
                </div>
              ) : pendingCases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No cases pending verification.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCases.map((c) => (
                    <CaseCard
                      key={c.caseId}
                      caseId={c.caseId}
                      status={c.status as never}
                      disputeType={c.disputeType}
                      institutionName={c.institutionName}
                      createdAt={c.createdAt}
                      href={`/admin/cases/${c.caseId}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </RevealItem>

        </StaggeredReveal>
      </div>
    </PageWrapper>
  )
}

export default function AdminPortal() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <AdminPortalContent />
    </AuthGuard>
  )
}
