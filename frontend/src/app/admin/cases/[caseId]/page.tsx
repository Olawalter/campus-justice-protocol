'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, ShieldCheck, Bell, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge'
import { CaseTimeline } from '@/components/cases/CaseTimeline'
import { JudgmentReveal } from '@/components/animations/JudgmentReveal'
import { EvidenceVault } from '@/components/cases/EvidenceVault'
import { AIDeliberationPanel } from '@/components/cases/AIDeliberationPanel'
import { DecentralizedCourtInfo } from '@/components/cases/DecentralizedCourtInfo'
import { PrecedentRefsPanel } from '@/components/cases/PrecedentRefsPanel'
import { InstitutionReputationPanel } from '@/components/cases/InstitutionReputationPanel'
import { useAuth } from '@/hooks/useAuth'
import { useCaseDetail, useAdminCaseActions } from '@/hooks/useCase'
import { formatDate, formatDisputeType, formatAddress } from '@/utils/format'
import { CaseStatus, JudgmentOutcome } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { getCaseMeta } from '@/services/firebase/firestore'
import { AICaseAnalysis } from '@/components/cases/AICaseAnalysis'

function AdminCaseDetailContent({ caseId }: { caseId: string }) {
  const { user } = useAuth()
  const { case: c, loading, error, refresh } = useCaseDetail(caseId)
  const { verifyCase, notifyInstitution, triggerEvaluation, triggerAppealEvaluation, loading: actionLoading, error: actionError } = useAdminCaseActions()
  const router = useRouter()
  const [filerUid, setFilerUid] = useState('')
  const [actionDone, setActionDone] = useState<string | null>(null)

  useEffect(() => {
    getCaseMeta(caseId).then((meta) => { if (meta) setFilerUid(meta.filerUid) })
  }, [caseId])

  async function handle(action: () => Promise<void>, label: string) {
    await action()
    setActionDone(label)
    refresh()
  }

  if (loading) {
    return (
      <PageWrapper role="admin" userName={user?.displayName}>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </PageWrapper>
    )
  }

  if (error || !c) {
    return (
      <PageWrapper role="admin" userName={user?.displayName}>
        <div className="max-w-4xl mx-auto text-center py-20">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 text-destructive opacity-60" />
          <p className="text-muted-foreground">{error ?? 'Case not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go back</Button>
        </div>
      </PageWrapper>
    )
  }

  const activeJudgment = c.appeal?.outcome ?? c.judgment

  return (
    <PageWrapper role="admin" userName={user?.displayName}>
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-sm font-semibold text-muted-foreground">{c.caseId}</h1>
              <CaseStatusBadge status={c.status} />
            </div>
            <p className="text-lg font-heading font-bold text-foreground mt-0.5">
              {formatDisputeType(c.disputeType)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {(actionError || actionDone) && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 border ${actionDone ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' : 'text-destructive bg-destructive/10 border-destructive/20'}`}>
            {actionDone
              ? <><CheckCircle2 className="h-4 w-4 shrink-0" />{actionDone} completed successfully.</>
              : <><AlertCircle className="h-4 w-4 shrink-0" />{actionError}</>
            }
          </div>
        )}

        {/* Admin action buttons */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">Admin Actions</h2>
          <div className="flex flex-wrap gap-2">
            {c.status === 'SUBMITTED' && (
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={() => handle(() => verifyCase(caseId, filerUid), 'Case verification')}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ShieldCheck className="h-4 w-4" />
                {actionLoading ? 'Processing…' : 'Verify Case'}
              </Button>
            )}
            {c.status === 'VERIFIED' && (
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={() => handle(() => notifyInstitution(caseId), 'Institution notification')}
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Bell className="h-4 w-4" />
                {actionLoading ? 'Processing…' : 'Notify Institution'}
              </Button>
            )}
            {c.status === 'RESPONDED' && (
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={() => handle(() => triggerEvaluation(caseId), 'AI evaluation')}
                className="gap-2 bg-secondary hover:bg-secondary/90 text-white"
              >
                <Cpu className="h-4 w-4" />
                {actionLoading ? 'Evaluating…' : 'Trigger AI Evaluation'}
              </Button>
            )}
            {c.status === 'APPEALED' && (
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={() => handle(() => triggerAppealEvaluation(caseId), 'Appeal evaluation')}
                className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Cpu className="h-4 w-4" />
                {actionLoading ? 'Evaluating…' : 'Trigger Appeal Evaluation'}
              </Button>
            )}
            {!['SUBMITTED', 'VERIFIED', 'RESPONDED', 'APPEALED'].includes(c.status) && (
              <p className="text-sm text-muted-foreground">No admin actions available for current status.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Case Summary */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">Case Summary</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Filer</p><p className="font-mono font-medium">{formatAddress(c.filer)}</p></div>
                <div><p className="text-xs text-muted-foreground">Institution</p><p className="font-mono font-medium">{formatAddress(c.institution)}</p></div>
                <div><p className="text-xs text-muted-foreground">Filed</p><p className="font-medium">{c.createdAt ? formatDate(c.createdAt) : '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Evidence</p><p className="font-medium">{c.evidenceHashes.length} files</p></div>
              </div>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground leading-relaxed">{c.description}</p>
              </div>
            </div>

            {/* AI Case Analysis */}
            <AICaseAnalysis
              caseId={c.caseId}
              disputeType={c.disputeType}
              description={c.description}
              institutionName={c.institutionName ?? c.institution}
              department={c.department}
              matricNumber={c.matricNumber}
              evidenceCount={c.evidenceHashes.length}
            />

            {/* Evidence Vault — student files */}
            <EvidenceVault hashes={c.evidenceHashes} label="Student Evidence Vault" />

            {/* Institution response files */}
            {c.responseHashes.length > 0 && (
              <EvidenceVault hashes={c.responseHashes} label="Institution Response Evidence" />
            )}

            {/* AI Deliberation */}
            <AIDeliberationPanel
              status={c.status}
              consensus={activeJudgment?.validatorConsensus}
            />

            {/* Judgment */}
            {activeJudgment && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
                  {c.appeal?.outcome ? 'Final Appeal Judgment' : 'AI-Reasoned Verdict'}
                </h2>
                <JudgmentReveal
                  outcome={activeJudgment.outcome as JudgmentOutcome}
                  confidenceScore={activeJudgment.confidenceScore}
                  reasoning={activeJudgment.reasoning}
                  evidenceSummary={activeJudgment.evidenceSummary}
                />
                {activeJudgment.validatorConsensus && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Validators: {activeJudgment.validatorConsensus.agreeingValidators}/{activeJudgment.validatorConsensus.totalValidators} agreed</span>
                    <span>Rounds: {activeJudgment.validatorConsensus.rounds}</span>
                    {activeJudgment.validatorConsensus.consensusReached && (
                      <Badge variant="outline" className="border-emerald-300 text-emerald-600 text-xs">Consensus Reached</Badge>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Precedent References */}
            <PrecedentRefsPanel refs={c.precedentRefs} role="admin" />
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 h-fit">
              <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-5">Progress</h2>
              <CaseTimeline currentStatus={c.status as CaseStatus} />
            </div>

            <DecentralizedCourtInfo />

            <InstitutionReputationPanel
              institutionAddress={c.institution}
              institutionName={c.institutionName}
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default function AdminCasePage({ params }: { params: { caseId: string } }) {
  const { caseId } = params
  return (
    <AuthGuard requiredRole="ADMIN">
      <AdminCaseDetailContent caseId={caseId} />
    </AuthGuard>
  )
}
