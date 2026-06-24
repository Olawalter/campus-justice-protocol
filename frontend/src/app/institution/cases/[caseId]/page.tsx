'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, Hash, Building2, BookOpen, RefreshCw,
  CheckCircle2, AlertCircle, Upload, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge'
import { CaseTimeline } from '@/components/cases/CaseTimeline'
import { JudgmentReveal } from '@/components/animations/JudgmentReveal'
import { EvidenceVault } from '@/components/cases/EvidenceVault'
import { AIDeliberationPanel } from '@/components/cases/AIDeliberationPanel'
import { DecentralizedCourtInfo } from '@/components/cases/DecentralizedCourtInfo'
import { PrecedentRefsPanel } from '@/components/cases/PrecedentRefsPanel'
import { useAuth } from '@/hooks/useAuth'
import { useCaseDetail, useInstitutionResponse } from '@/hooks/useCase'
import { formatDate, formatDisputeType, formatAddress } from '@/utils/format'
import { CaseStatus, JudgmentOutcome } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

function InstitutionCaseDetailContent({ caseId }: { caseId: string }) {
  const { user } = useAuth()
  const { case: c, loading, error, refresh } = useCaseDetail(caseId)
  const { submitResponse, submitting, error: responseError, evidence } = useInstitutionResponse()
  const router = useRouter()

  const [responseText, setResponseText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      evidence.addFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  async function handleSubmitResponse(e: React.FormEvent) {
    e.preventDefault()
    await submitResponse(caseId, responseText)
    setSubmitted(true)
    refresh()
  }

  if (loading) {
    return (
      <PageWrapper role="institution" userName={user?.displayName}>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </PageWrapper>
    )
  }

  if (error || !c) {
    return (
      <PageWrapper role="institution" userName={user?.displayName}>
        <div className="max-w-4xl mx-auto text-center py-20">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 text-destructive opacity-60" />
          <p className="text-muted-foreground">{error ?? 'Case not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go back</Button>
        </div>
      </PageWrapper>
    )
  }

  const canRespond = c.status === 'INSTITUTION_NOTIFIED' && user?.walletAddress === c.institution
  const activeJudgment = c.appeal?.outcome ?? c.judgment

  return (
    <PageWrapper role="institution" userName={user?.displayName}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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

        {/* Progress stepper */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">Case Progress</p>
          <CaseTimeline currentStatus={c.status} variant="horizontal" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Student complaint */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Student Complaint
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Matric Number</p>
                    <p className="font-medium">{c.matricNumber ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{c.department ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Filed</p>
                    <p className="font-medium">{c.createdAt ? formatDate(c.createdAt) : '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Evidence Files</p>
                    <p className="font-medium">{c.evidenceHashes.length}</p>
                  </div>
                </div>
              </div>

              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Complaint</p>
                <p className="text-sm text-foreground leading-relaxed">{c.description}</p>
              </div>
            </div>

            {/* Student Evidence Vault */}
            <EvidenceVault hashes={c.evidenceHashes} label="Student Evidence Vault" />

            {/* Response form */}
            {canRespond && !submitted && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Submit Institutional Response
                </h2>
                {responseError && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {responseError}
                  </div>
                )}
                <form onSubmit={handleSubmitResponse} className="space-y-4">
                  <Textarea
                    placeholder="Provide your institution's formal response to the student's complaint. Include relevant policies, dates, and evidence of proper procedure…"
                    className="min-h-[160px] resize-none"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    minLength={30}
                    required
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Supporting Documents (optional)</label>
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-secondary/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload institutional records or policies</span>
                      <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleFileChange} />
                    </label>
                    {evidence.files.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1 truncate">{file.name}</span>
                        {evidence.uploading && <Progress value={evidence.progress[i] ?? 0} className="w-16 h-1" />}
                        <button type="button" onClick={() => evidence.removeFile(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-secondary hover:bg-secondary/90 text-white h-11"
                  >
                    {submitting ? 'Submitting to GenLayer…' : 'Submit Response'}
                  </Button>
                </form>
              </div>
            )}

            {submitted && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl px-4 py-3">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Response submitted. The AI arbitration will begin shortly.
              </div>
            )}

            {/* Institution response evidence */}
            {c.responseHashes.length > 0 && (
              <EvidenceVault hashes={c.responseHashes} label="Your Submitted Evidence" />
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
                    {activeJudgment.validatorConsensus.consensusReached && (
                      <Badge variant="outline" className="border-emerald-300 text-emerald-600 text-xs">Consensus Reached</Badge>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Precedent References */}
            <PrecedentRefsPanel refs={c.precedentRefs} role="institution" />
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-5">
                Progress
              </h2>
              <CaseTimeline currentStatus={c.status as CaseStatus} />
            </div>

            <DecentralizedCourtInfo />

            <div className="bg-card border border-border rounded-xl p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm mb-3">On-Chain Info</p>
              <div>
                <p>Filer</p>
                <p className="font-mono">{formatAddress(c.filer)}</p>
              </div>
              <div>
                <p>Filed</p>
                <p>{c.createdAt ? formatDate(c.createdAt) : '—'}</p>
              </div>
              <div>
                <p>Precedent refs</p>
                <p>{c.precedentRefs.length} case{c.precedentRefs.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default function InstitutionCasePage({ params }: { params: { caseId: string } }) {
  const { caseId } = params
  return (
    <AuthGuard requiredRole="INSTITUTION">
      <InstitutionCaseDetailContent caseId={caseId} />
    </AuthGuard>
  )
}
