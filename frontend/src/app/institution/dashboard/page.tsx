'use client'

import { useEffect, useState } from 'react'
import { FolderOpen, Clock, CheckCircle2, Star, TrendingUp, BarChart3, Library, Globe, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { StaggeredReveal, RevealItem } from '@/components/animations/StaggeredReveal'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { CaseCard } from '@/components/cases/CaseCard'
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge'
import { CaseStatus } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useInstitutionCases } from '@/hooks/useCase'
import { Skeleton } from '@/components/ui/skeleton'
import { InstitutionProfile } from '@/types'
import { getInstitutionProfile } from '@/services/genlayer/contract'
import { motion } from 'framer-motion'

function ReputationRing({ score, color }: { score: number; color: string }) {
  const pct = Math.round(score * 100)
  const c = 2 * Math.PI * 14
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" className="stroke-muted" strokeWidth="3" />
        <motion.circle
          cx="18" cy="18" r="14" fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${(pct / 100) * c} ${c}` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
      </div>
    </div>
  )
}

function InstitutionDashboardContent() {
  const { user } = useAuth()
  const { cases, loading, error: casesError } = useInstitutionCases()
  const [profile, setProfile] = useState<InstitutionProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const pending = cases.filter((c) => c.status === 'INSTITUTION_NOTIFIED').length
  const resolved = cases.filter((c) => ['JUDGMENT_ISSUED', 'FINAL_JUDGMENT', 'CLOSED'].includes(c.status)).length
  const deliberating = cases.filter((c) => c.status === 'DELIBERATING').length
  const pendingCases = cases.filter((c) => c.status === 'INSTITUTION_NOTIFIED')
  // All cases sorted newest first, latest 5 shown on dashboard
  const recentCases = [...cases].slice(0, 5)

  useEffect(() => {
    if (!user?.walletAddress) return
    getInstitutionProfile(user.walletAddress)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false))
  }, [user?.walletAddress])

  const reputationScore = profile?.reputationScore ?? 0
  const scoreColor =
    reputationScore >= 0.75 ? '#10B981' : reputationScore >= 0.5 ? '#F59E0B' : '#EF4444'

  return (
    <PageWrapper role="institution" userName={user?.displayName ?? 'Institution'}>
      <div className="space-y-8">
        {casesError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span><strong>Could not load cases:</strong> {casesError}</span>
          </div>
        )}
        <StaggeredReveal>
          <RevealItem>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Institution Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                {user?.institutionName ?? user?.displayName} — Manage incoming cases and track your reputation.
              </p>
            </div>
          </RevealItem>

          {/* Metrics */}
          <RevealItem>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Total Cases" value={cases.length} icon={FolderOpen} iconColor="#2563EB" delay={0} />
              <MetricCard label="Pending Response" value={pending} icon={Clock} iconColor="#F59E0B" delay={0.06} />
              <MetricCard label="Resolved" value={resolved} icon={CheckCircle2} iconColor="#10B981" delay={0.12} />
              <MetricCard
                label="Reputation"
                value={Math.round(reputationScore * 100)}
                suffix="%"
                icon={Star}
                iconColor="#8B5CF6"
                delay={0.18}
              />
            </div>
          </RevealItem>

          {/* Reputation + Analytics panel */}
          <RevealItem>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Reputation card */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-semibold text-foreground">Institution Reputation</h2>
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Star className="h-3.5 w-3.5 text-violet-500" />
                  </div>
                </div>
                {profileLoading ? (
                  <Skeleton className="h-20 rounded-lg" />
                ) : profile ? (
                  <div className="flex items-center gap-5">
                    <ReputationRing score={reputationScore} color={scoreColor} />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm flex-1">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Cases</p>
                        <p className="font-semibold text-foreground">{profile.totalCases}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Resolved</p>
                        <p className="font-semibold text-foreground">{profile.resolvedCases}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Resolution</p>
                        <p className="font-semibold text-foreground">{profile.avgResolutionDays}d</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Appeal Rate</p>
                        <p className="font-semibold text-foreground">{Math.round(profile.appealSuccessRate * 100)}%</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Reputation data not yet available on-chain.</p>
                )}
              </div>

              {/* Case breakdown */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-semibold text-foreground">Case Breakdown</h2>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Pending Response', value: pending, total: cases.length, color: '#F59E0B' },
                    { label: 'Deliberating', value: deliberating, total: cases.length, color: '#8B5CF6' },
                    { label: 'Resolved', value: resolved, total: cases.length, color: '#10B981' },
                  ].map(({ label, value, total, color }) => (
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
                          animate={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </RevealItem>

          {/* Quick links */}
          <RevealItem>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { href: '/precedents', icon: Library, label: 'Precedent Library', color: '#F59E0B', desc: 'AI case references' },
                { href: '/transparency', icon: Globe, label: 'Public Transparency', color: '#2563EB', desc: 'Live on-chain stats' },
                { href: '/institution/cases', icon: TrendingUp, label: 'All Cases', color: '#10B981', desc: 'Full case history' },
              ].map(({ href, icon: Icon, label, color, desc }) => (
                <Link key={href} href={href}>
                  <div className="rounded-xl border border-border bg-card p-4 hover:border-secondary/40 transition-all group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: color + '18' }}>
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-secondary transition-colors">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </RevealItem>

          {/* Pending — requires response */}
          {pendingCases.length > 0 && (
            <RevealItem>
              <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <h2 className="font-heading font-semibold text-amber-700 dark:text-amber-400">
                    Requires Your Response ({pendingCases.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {pendingCases.map((c) => (
                    <CaseCard
                      key={c.caseId}
                      caseId={c.caseId}
                      status={c.status as never}
                      disputeType={c.disputeType}
                      institutionName={c.institutionName}
                      createdAt={c.createdAt}
                      href={`/institution/cases/${c.caseId}`}
                    />
                  ))}
                </div>
              </div>
            </RevealItem>
          )}

          {/* All cases */}
          <RevealItem>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-foreground">All Cases</h2>
                {cases.length > 5 && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/institution/cases">View all {cases.length}</Link>
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
                </div>
              ) : cases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No cases filed against your institution yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCases.map((c) => (
                    <Link key={c.caseId} href={`/institution/cases/${c.caseId}`} className="block">
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors px-4 py-3 cursor-pointer">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-muted-foreground">{c.caseId}</p>
                          <p className="text-sm font-medium text-foreground truncate mt-0.5">{c.disputeType}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                          </p>
                        </div>
                        <CaseStatusBadge status={c.status as CaseStatus} />
                      </div>
                    </Link>
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

export default function InstitutionDashboard() {
  return (
    <AuthGuard requiredRole="INSTITUTION">
      <InstitutionDashboardContent />
    </AuthGuard>
  )
}
