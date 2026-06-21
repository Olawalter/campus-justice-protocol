'use client'

import { useState, useEffect } from 'react'
import { Building2, RefreshCw, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'
import { InstitutionProfile } from '@/types'
import { formatAddress } from '@/utils/format'
import * as contract from '@/services/genlayer/contract'
import { cn } from '@/utils/cn'

function AdminInstitutionsContent() {
  const { user } = useAuth()
  const [institutions, setInstitutions] = useState<InstitutionProfile[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const list = await contract.getAllInstitutions()
      setInstitutions(list)
    } catch {
      setInstitutions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <PageWrapper role="admin" userName={user?.displayName}>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Institutions</h1>
            <p className="text-muted-foreground mt-1">{institutions.length} registered institution{institutions.length !== 1 ? 's' : ''}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : institutions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No institutions registered yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {institutions.map((inst) => (
              <div key={inst.address} className="bg-card border border-border rounded-xl p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{inst.name}</h3>
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1',
                        inst.verified
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      )}>
                        {inst.verified
                          ? <><CheckCircle2 className="h-2.5 w-2.5" /> Verified</>
                          : <><Clock className="h-2.5 w-2.5" /> Pending</>
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{formatAddress(inst.address)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{inst.domain}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{inst.totalCases} cases</p>
                  <p className="text-xs text-muted-foreground">
                    Rep: {(inst.reputationScore * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default function AdminInstitutionsPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <AdminInstitutionsContent />
    </AuthGuard>
  )
}
