'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Scale, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Case } from '@/types'
import { getCase } from '@/services/genlayer/contract'
import { formatDisputeType, formatConfidence } from '@/utils/format'
import { Skeleton } from '@/components/ui/skeleton'

interface PrecedentRefsPanelProps {
  refs: string[]
  role?: string
}

export function PrecedentRefsPanel({ refs, role = 'student' }: PrecedentRefsPanelProps) {
  const [precedents, setPrecedents] = useState<Case[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (refs.length === 0) return
    setLoading(true)
    Promise.all(refs.slice(0, 5).map((id) => getCase(id).catch(() => null)))
      .then((cases) => setPrecedents(cases.filter(Boolean) as Case[]))
      .finally(() => setLoading(false))
  }, [refs])

  if (refs.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <BookOpen className="h-3.5 w-3.5 text-amber-500" />
        </div>
        <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Precedent References
        </h2>
      </div>

      <p className="text-xs text-muted-foreground">
        Similar past cases the AI consulted when forming its judgment.
      </p>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : precedents.length > 0 ? (
        <div className="space-y-2">
          {precedents.map((p) => (
            <Link key={p.caseId} href={`/${role}/cases/${p.caseId}`} className="block">
              <div className="flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2.5 hover:bg-muted/70 transition-colors group">
                <Scale className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-muted-foreground">{p.caseId}</p>
                  <p className="text-xs font-medium text-foreground truncate">
                    {formatDisputeType(p.disputeType)}
                  </p>
                </div>
                {p.judgment && (
                  <span className="text-xs font-semibold text-secondary shrink-0">
                    {formatConfidence(p.judgment.confidenceScore)}
                  </span>
                )}
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {refs.map((ref) => (
            <div key={ref} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
              <Scale className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="text-xs font-mono text-muted-foreground">{ref}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
