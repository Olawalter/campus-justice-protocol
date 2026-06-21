'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Building2, ArrowRight, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CaseStatusBadge } from './CaseStatusBadge'
import { CaseStatus, DisputeType } from '@/types'
import { formatDate, formatDisputeType } from '@/utils/format'

interface CaseCardProps {
  caseId: string
  status: CaseStatus
  disputeType: string
  institutionName?: string
  description?: string
  createdAt: number
  href: string
  index?: number
}

export function CaseCard({
  caseId,
  status,
  disputeType,
  institutionName,
  description,
  createdAt,
  href,
  index = 0,
}: CaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
    >
      <Link href={href}>
        <Card className="border border-border hover:border-secondary/50 hover:shadow-md transition-all cursor-pointer group bg-card">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-md bg-secondary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-mono text-muted-foreground truncate">{caseId}</p>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {formatDisputeType(disputeType as DisputeType)}
                  </p>
                </div>
              </div>
              <CaseStatusBadge status={status} />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                {institutionName && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {institutionName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(createdAt)}
                </span>
              </div>
              <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-secondary" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
