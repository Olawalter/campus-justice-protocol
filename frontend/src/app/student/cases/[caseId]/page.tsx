'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, FileText, Hash, Building2, BookOpen, RefreshCw,
  ShieldAlert, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
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
import { useCaseDetail, useAppeal } from '@/hooks/useCase'
import { formatDate, formatDisputeType, formatAddress } from '@/utils/format'
import { CaseStatus, JudgmentOutcome } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

function safe(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return JSON.stringify(v)
}

function CaseDetailContent({ caseId }: { caseId: string }) {
  const { user } = useAuth()
  const { case: c, meta, loading, error, refresh } = useCaseDetail(caseId)
  const { fileAppeal, submitting: appealSubmitting, error: appealError } = useAppeal()
  const router = useRouter()

  const [showAppealForm, setShowAppealForm] = useState(false)
  const [appealGrounds, setAppealGrounds] = useState('')
  const [appealDone, setAppealDone] = useState(false)
  const [showFullDesc, setShowFullDesc] = useState(false)

  async function handleAppeal(e: React.FormEvent) {
    e.preventDefault()
    await fileAppeal(caseId, appealGrounds)
    setAppealDone(true)
    setShowAppealForm(false)
    refresh()
  }

  if (loading) {
    return (
      <PageWrapper role="student" userName={user?.displayName}>
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
      <PageWrapper role="student" userName={user?.displayName}>
        <div className="max-w-4xl mx-auto text-center py-20">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 text-destructive opacity-60" />
          <p className="text-muted-foreground">{safe(error) || 'Case not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go back</Button>
        </div>
      </PageWrapper>
    )
  }

  const displayId = safe(c.caseId) || caseId
  const status = safe(c.status) || 'SUBMITTED'
  const disputeType = safe(c.disputeType) || 'OTHER'
  const description = safe(c.description) || (meta ? 'Case details available in Firestore metadata only.' : '')
  const instName = safe(c.institutionName) || safe(c.institution)
  const dept = safe(c.department)
  const matric = safe(c.matricNumber)
  const filer = safe(c.filer)
  const institution = safe(c.institution)
  const hashes = Array.isArray(c.evidenceHashes) ? c.evidenceHashes.map(safe) : []
  const responseHashes = Array.isArray(c.responseHashes) ? c.responseHashes.map(safe) : []
  const precedentRefs = Array.isArray(c.precedentRefs) ? c.precedentRefs.map(safe) : []

  const activeJudgment = c.appeal?.outcome ?? c.judgment
  const canAppeal = status === 'JUDGMENT_ISSUED' && !c.appeal && user?.walletAddress === filer

  const validStatus = [
    'SUBMITTED', 'VERIFIED', 'INSTITUTION_NOTIFIED', 'RESPONDED',
    'DELIBERATING', 'JUDGMENT_ISSUED', 'APPEALED', 'FINAL_JUDGMENT', 'CLOSED',
  ].includes(status) ? status as CaseStatus : 'SUBMITTED' as CaseStatus

  return (
    <PageWrapper role="student" userName={user?.displayName}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-mono text-sm font-semibold text-muted-foreground">{displayId}</h1>
              <CaseStatusBadge status={validStatus} />
            </div>
            <p className="text-lg font-heading font-bold text-foreground mt-0.5">
              {formatDisputeType(disputeType as never) || disputeType}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} title="Refresh from chain">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Firestore fallback notice */}
        {meta && !filer && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            This case was filed before the case ID fix. On-chain data is unavailable, showing cached metadata.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Case metadata */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="font-heading font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground">
                Case Details
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Institution</p>
                    <p className="font-medium text-foreground">{instName ? (instName.startsWith('0x') ? formatAddress(instName) : instName) : '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium text-foreground">{dept || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Matric Number</p>
                    <p className="font-medium text-foreground">{matric || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Evidence Files</p>
                    <p className="font-medium text-foreground">
                      {hashes.length || (meta?.evidenceFileUrls?.length ?? 0)} file{(hashes.length || (meta?.evidenceFileUrls?.length ?? 0)) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-2">Description</p>
                <p className={`text-sm text-foreground leading-relaxed ${!showFullDesc ? 'line-clamp-4' : ''}`}>
                  {description || 'No description available.'}
                </p>
                {description.length > 200 && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-xs text-secondary hover:underline mt-1 flex items-center gap-1"
                  >
                    {showFullDesc
                      ? <><ChevronUp className="h-3 w-3" /> Show less</>
                      : <><ChevronDown className="h-3 w-3" /> Show full description</>}
                  </button>
                )}
              </div>
            </div>

            {/* Evidence Vault */}
            <EvidenceVault hashes={hashes} label="Evidence Vault" />

            {/* Institution response hashes */}
            {responseHashes.length > 0 && (
              <EvidenceVault hashes={responseHashes} label="Institution Response Files" />
            )}

            {/* AI Deliberation */}
            <AIDeliberationPanel
              status={status}
              consensus={activeJudgment?.validatorConsensus}
            />

            {/* Judgment */}
            {activeJudgment && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
                  {c.appeal?.outcome ? 'Final Appeal Judgment' : 'AI-Reasoned Verdict'}
                </h2>
                <JudgmentReveal
                  outcome={safe(activeJudgment.outcome) as JudgmentOutcome}
                  confidenceScore={activeJudgment.confidenceScore}
                  reasoning={safe(activeJudgment.reasoning)}
                  evidenceSummary={safe(activeJudgment.evidenceSummary)}
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
            <PrecedentRefsPanel refs={precedentRefs} role="student" />

            {/* Appeal filed notice */}
            {c.appeal && !c.appeal.outcome && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  <h3 className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Appeal Filed</h3>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">{safe(c.appeal.grounds)}</p>
              </div>
            )}

            {/* Appeal form */}
            {canAppeal && !appealDone && (
              <div className="bg-card border border-border rounded-xl p-5">
                <button
                  onClick={() => setShowAppealForm(!showAppealForm)}
                  className="flex items-center gap-2 text-sm font-semibold text-foreground w-full"
                >
                  <ShieldAlert className="h-4 w-4 text-secondary" />
                  File an Appeal
                  {showAppealForm ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </button>
                {showAppealForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={handleAppeal}
                    className="mt-4 space-y-3"
                  >
                    {appealError && (
                      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {safe(appealError)}
                      </div>
                    )}
                    <Textarea
                      placeholder="State the grounds for your appeal. Minimum 20 characters. Include any new evidence or procedural errors…"
                      className="min-h-[120px] resize-none"
                      value={appealGrounds}
                      onChange={(e) => setAppealGrounds(e.target.value)}
                      minLength={20}
                      maxLength={2000}
                      required
                    />
                    <p className="text-xs text-muted-foreground text-right">{appealGrounds.length}/2000</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAppealForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={appealSubmitting}
                        className="bg-secondary hover:bg-secondary/90 text-white"
                      >
                        {appealSubmitting ? 'Submitting…' : 'Submit Appeal'}
                      </Button>
                    </div>
                  </motion.form>
                )}
              </div>
            )}

            {appealDone && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Appeal submitted successfully. The panel will review your case.
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Progress */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-5">
                Progress
              </h2>
              <CaseTimeline currentStatus={validStatus} />
            </div>

            {/* Decentralized Court */}
            <DecentralizedCourtInfo />

            {/* Institution Reputation */}
            {institution && (
              <InstitutionReputationPanel
                institutionAddress={institution}
                institutionName={safe(c.institutionName)}
              />
            )}

            {/* On-chain info */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm mb-3">On-Chain Info</p>
              <div className="space-y-2">
                <div>
                  <p className="text-muted-foreground">Filer</p>
                  <p className="font-mono">{filer ? formatAddress(filer) : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Institution</p>
                  <p className="font-mono">{institution ? formatAddress(institution) : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Filed</p>
                  <p>{c.createdAt ? formatDate(c.createdAt) : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Precedent refs</p>
                  <p>{precedentRefs.length} case{precedentRefs.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default function StudentCasePage({ params }: { params: { caseId: string } }) {
  const { caseId } = params
  return (
    <AuthGuard requiredRole="STUDENT">
      <CaseDetailContent caseId={caseId} />
    </AuthGuard>
  )
}
