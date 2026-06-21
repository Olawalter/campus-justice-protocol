'use client'

import { useState, useEffect } from 'react'
import { Library, RefreshCw, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'
import { Case, DisputeType } from '@/types'
import { DISPUTE_TYPES } from '@/config/constants'
import { formatDisputeType, formatDate, formatConfidence } from '@/utils/format'
import * as contract from '@/services/genlayer/contract'
import Link from 'next/link'

const ALL = 'ALL'

function PrecedentsContent() {
  const { user } = useAuth()
  const [precedents, setPrecedents] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<DisputeType | typeof ALL>(ALL)

  const role = user?.role === 'STUDENT' ? 'student' : user?.role === 'INSTITUTION' ? 'institution' : 'admin'

  async function load() {
    setLoading(true)
    try {
      const list = await contract.getAllPrecedents(100)
      setPrecedents(list)
    } catch {
      setPrecedents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = typeFilter === ALL ? precedents : precedents.filter((p) => p.disputeType === typeFilter)

  return (
    <PageWrapper role={role} userName={user?.displayName}>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Precedents</h1>
            <p className="text-muted-foreground mt-1">
              High-confidence AI judgments that inform future cases.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="flex gap-3">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DisputeType | typeof ALL)}
          >
            <option value={ALL}>All dispute types</option>
            {DISPUTE_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Library className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{precedents.length === 0 ? 'No precedents established yet.' : 'No precedents for this dispute type.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <Link key={p.caseId} href={`/${role}/cases/${p.caseId}`} className="block">
                <div className="bg-card border border-border rounded-xl p-5 hover:border-secondary/40 transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Scale className="h-4 w-4 text-secondary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground">{p.caseId}</span>
                          <CaseStatusBadge status={p.status} />
                        </div>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {formatDisputeType(p.disputeType)}
                        </p>
                        {p.judgment && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {p.judgment.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      {p.judgment && (
                        <>
                          <p className="text-sm font-semibold text-secondary">
                            {formatConfidence(p.judgment.confidenceScore)}
                          </p>
                          <p className="text-xs text-muted-foreground">confidence</p>
                        </>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default function PrecedentsPage() {
  return (
    <AuthGuard>
      <PrecedentsContent />
    </AuthGuard>
  )
}
