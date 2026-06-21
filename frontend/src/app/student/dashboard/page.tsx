'use client'

import { FilePlus, FolderOpen, Scale, Clock, Library, Globe, ShieldCheck, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { StaggeredReveal, RevealItem } from '@/components/animations/StaggeredReveal'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { CaseCard } from '@/components/cases/CaseCard'
import { useAuth } from '@/hooks/useAuth'
import { useStudentCases } from '@/hooks/useCase'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

function StudentDashboardContent() {
  const { user } = useAuth()
  const { cases, loading } = useStudentCases()

  const active = cases.filter((c) =>
    !['JUDGMENT_ISSUED', 'FINAL_JUDGMENT', 'CLOSED'].includes(c.status)
  ).length
  const resolved = cases.filter((c) =>
    ['JUDGMENT_ISSUED', 'FINAL_JUDGMENT', 'CLOSED'].includes(c.status)
  ).length
  const deliberating = cases.filter((c) => c.status === 'DELIBERATING').length
  const successRate = resolved > 0 ? Math.round((resolved / cases.length) * 100) : 0

  const breakdownItems = [
    { label: 'Active', value: active, total: cases.length, color: '#F59E0B' },
    { label: 'Deliberating', value: deliberating, total: cases.length, color: '#8B5CF6' },
    { label: 'Resolved', value: resolved, total: cases.length, color: '#10B981' },
  ]

  return (
    <PageWrapper role="student" userName={user?.displayName ?? 'Student'}>
      <div className="space-y-8">
        <StaggeredReveal>
          <RevealItem>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold text-foreground">
                  Welcome back, {user?.displayName?.split(' ')[0]}
                </h1>
                <p className="text-muted-foreground mt-1">Track your disputes and case outcomes.</p>
              </div>
              <Button className="bg-secondary hover:bg-secondary/90 text-white gap-2 hidden md:flex" asChild>
                <Link href="/student/file-dispute">
                  <FilePlus className="h-4 w-4" />
                  File Dispute
                </Link>
              </Button>
            </div>
          </RevealItem>

          {/* Metrics */}
          <RevealItem>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Total Cases" value={cases.length} icon={FolderOpen} iconColor="#2563EB" delay={0} />
              <MetricCard label="Active" value={active} icon={Clock} iconColor="#F59E0B" delay={0.06} />
              <MetricCard label="Resolved" value={resolved} icon={Scale} iconColor="#10B981" delay={0.12} />
              <MetricCard label="Success Rate" value={successRate} suffix="%" icon={Scale} iconColor="#8B5CF6" delay={0.18} />
            </div>
          </RevealItem>

          {/* Case Analytics + Quick Access */}
          {cases.length > 0 && (
            <RevealItem>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Case breakdown */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h2 className="font-heading font-semibold text-foreground">Case Analytics</h2>
                  <div className="space-y-3">
                    {breakdownItems.map(({ label, value, total, color }) => (
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
                  {deliberating > 0 && (
                    <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 bg-violet-500/5 rounded-lg px-3 py-2 border border-violet-200 dark:border-violet-800">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-violet-500"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      {deliberating} case{deliberating !== 1 ? 's' : ''} currently in AI deliberation
                    </div>
                  )}
                </div>

                {/* Evidence Integrity info */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h2 className="font-heading font-semibold text-foreground">Evidence Integrity</h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">SHA-256 Hashing</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Every file you upload is fingerprinted and the hash stored on-chain — no one can alter your evidence.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Scale className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">AI-Reasoned Verdicts</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Judgments are produced by 5 GenLayer validator nodes that independently evaluate all evidence before reaching consensus.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-lg border border-amber-200 dark:border-amber-800">
                      <Library className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Precedent Library</p>
                        <p className="text-xs text-muted-foreground mt-0.5">The AI references past high-confidence cases to ensure consistent rulings across similar disputes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealItem>
          )}

          {/* Quick access links */}
          <RevealItem>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { href: '/student/file-dispute', icon: FilePlus, label: 'File Dispute', color: '#2563EB', desc: 'Start a new case' },
                { href: '/precedents', icon: Library, label: 'Precedent Library', color: '#F59E0B', desc: 'Past AI judgments' },
                { href: '/transparency', icon: Globe, label: 'Public Transparency', color: '#8B5CF6', desc: 'Live on-chain stats' },
                { href: '/student/cases', icon: TrendingUp, label: 'All My Cases', color: '#10B981', desc: 'Full case history' },
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

          {/* Recent cases */}
          <RevealItem>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-foreground">Recent Cases</h2>
                {cases.length > 0 && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/student/cases">View all</Link>
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : cases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No cases yet. File your first dispute.</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/student/file-dispute">
                      <FilePlus className="h-3.5 w-3.5 mr-2" />
                      File Dispute
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cases.slice(0, 5).map((c) => (
                    <CaseCard
                      key={c.caseId}
                      caseId={c.caseId}
                      status={c.status as never}
                      disputeType={c.disputeType}
                      institutionName={c.institutionName}
                      createdAt={c.createdAt}
                      href={`/student/cases/${c.caseId}`}
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

export default function StudentDashboard() {
  return (
    <AuthGuard requiredRole="STUDENT">
      <StudentDashboardContent />
    </AuthGuard>
  )
}
