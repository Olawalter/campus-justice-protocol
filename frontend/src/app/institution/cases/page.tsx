'use client'

import { useState } from 'react'
import { FolderOpen, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { CaseCard } from '@/components/cases/CaseCard'
import { useAuth } from '@/hooks/useAuth'
import { useInstitutionCases } from '@/hooks/useCase'
import { Skeleton } from '@/components/ui/skeleton'
import { CaseStatus, DisputeType } from '@/types'
import { DISPUTE_TYPES } from '@/config/constants'

const ALL = 'ALL'

function InstitutionCasesContent() {
  const { user } = useAuth()
  const { cases, loading } = useInstitutionCases()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CaseStatus | typeof ALL>(ALL)
  const [typeFilter, setTypeFilter] = useState<DisputeType | typeof ALL>(ALL)

  const filtered = cases.filter((c) => {
    if (statusFilter !== ALL && c.status !== statusFilter) return false
    if (typeFilter !== ALL && c.disputeType !== typeFilter) return false
    if (search && !c.caseId.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <PageWrapper role="institution" userName={user?.displayName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Cases</h1>
          <p className="text-muted-foreground mt-1">{cases.length} dispute{cases.length !== 1 ? 's' : ''} filed against your institution</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by case ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CaseStatus | typeof ALL)}
          >
            <option value={ALL}>All statuses</option>
            {['SUBMITTED','VERIFIED','INSTITUTION_NOTIFIED','RESPONDED','DELIBERATING','JUDGMENT_ISSUED','APPEALED','FINAL_JUDGMENT','CLOSED'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DisputeType | typeof ALL)}
          >
            <option value={ALL}>All types</option>
            {DISPUTE_TYPES.map((dt) => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{cases.length === 0 ? 'No cases yet.' : 'No cases match your filters.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <CaseCard
                key={c.caseId}
                caseId={c.caseId}
                status={c.status as CaseStatus}
                disputeType={c.disputeType as DisputeType}
                createdAt={c.createdAt}
                href={`/institution/cases/${c.caseId}`}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default function InstitutionCasesPage() {
  return (
    <AuthGuard requiredRole="INSTITUTION">
      <InstitutionCasesContent />
    </AuthGuard>
  )
}
