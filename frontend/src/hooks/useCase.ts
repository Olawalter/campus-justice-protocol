'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useEvidence } from './useEvidence'
import { useStore } from '@/store'
import {
  saveCaseMeta,
  updateCaseMeta,
  subscribeToCasesByFiler,
  subscribeToCasesByInstitution,
  CaseMeta,
  createNotification,
  getAdminUids,
  getUserByWalletAddress,
  getCaseMeta,
  getCasesByFiler,
  getCasesByInstitution,
} from '@/services/firebase/firestore'
import * as contract from '@/services/genlayer/contract'
import { sendCaseEmail } from '@/services/email'
import { CaseFilingInput, Case } from '@/types'

// ── Case filing ───────────────────────────────────────────────────────────────

export function useCaseFiling() {
  const { user } = useAuth()
  const evidence = useEvidence()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [caseId, setCaseId] = useState<string | null>(null)

  const submitCase = useCallback(
    async (input: CaseFilingInput): Promise<string> => {
      if (!user?.walletAddress || !user?.walletPrivateKey) throw new Error('Wallet not provisioned. Please re-register your account.')
      setSubmitting(true)
      setError(null)

      const caller = { address: user.walletAddress, privateKey: user.walletPrivateKey }

      try {
        // 1. Hash all evidence files client-side
        const hashes = await evidence.hashAllFiles()

        // 2. Submit to GenLayer (source of truth)
        let result = await contract.createCase(caller, {
          institutionAddress: input.institution,
          disputeType: input.disputeType,
          description: input.description,
          evidenceHashes: hashes,
          matricNumber: input.matricNumber,
          department: input.department,
        })

        // Auto-register on-chain if not yet registered, then retry
        if (!result.success && result.error?.includes('registered students')) {
          await fetch('/api/register-on-chain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: user.walletAddress, role: user.role }),
          })
          // Wait for on-chain finalization
          await new Promise((r) => setTimeout(r, 8000))
          result = await contract.createCase(caller, {
            institutionAddress: input.institution,
            disputeType: input.disputeType,
            description: input.description,
            evidenceHashes: hashes,
            matricNumber: input.matricNumber,
            department: input.department,
          })
        }

        if (!result.success) throw new Error(result.error ?? 'Contract call failed')

        // The contract returns the real case ID (e.g. CJP-000001) as its return value.
        // Fall back to tx hash if return value extraction failed.
        const newCaseId = result.returnValue && result.returnValue.startsWith('CJP-')
          ? result.returnValue
          : result.hash

        // 3. Upload evidence files to Firebase Storage
        const uploads = await evidence.uploadAll(newCaseId, user.uid)

        // 4. Save metadata to Firestore (off-chain cache)
        await saveCaseMeta({
          caseId: newCaseId,
          filerUid: user.uid,
          filerName: user.displayName,
          filerEmail: user.email,
          institutionAddress: input.institution,
          institutionName: input.institutionName,
          institutionEmail: input.institutionEmail,
          disputeType: input.disputeType,
          description: input.description,
          status: 'SUBMITTED',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          evidenceFileUrls: uploads.map((u) => u.url),
          responseFileUrls: [],
          matricNumber: input.matricNumber,
          department: input.department,
          notificationSent: false,
        })

        // 5. Notify all admins that a new case was filed
        try {
          const adminUids = await getAdminUids()
          await Promise.all(
            adminUids.map((adminUid) =>
              createNotification({
                recipientUid: adminUid,
                type: 'CASE_FILED',
                caseId: newCaseId,
                message: `New dispute filed by ${user.displayName} — case ${newCaseId} requires verification.`,
              })
            )
          )
        } catch {
          // Non-fatal: admin notifications are best-effort
        }

        // 6. Email the institution directly using the address provided on the form
        if (input.institutionEmail) {
          sendCaseEmail({
            to: input.institutionEmail,
            type: 'CASE_FILED_INSTITUTION',
            caseId: newCaseId,
            institutionName: input.institutionName,
            disputeType: input.disputeType,
            description: input.description,
            studentName: user.displayName,
          })
        }

        // 7. Confirmation email to the student
        sendCaseEmail({
          to: user.email,
          type: 'CASE_FILED_STUDENT_CONFIRM',
          caseId: newCaseId,
          institutionName: input.institutionName,
          disputeType: input.disputeType,
          studentName: user.displayName,
        })

        setCaseId(newCaseId)
        evidence.reset()
        return newCaseId
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to submit case'
        setError(msg)
        throw e
      } finally {
        setSubmitting(false)
      }
    },
    [user, evidence]
  )

  return { submitCase, submitting, error, caseId, evidence }
}

// ── Student case list ─────────────────────────────────────────────────────────

export function useStudentCases() {
  const { user } = useAuth()
  const [cases, setCases] = useState<CaseMeta[]>([])
  const [loading, setLoading] = useState(true)
  const setCaseCache = useStore((s) => s.setCaseCache)

  useEffect(() => {
    if (!user?.uid) return
    setLoading(true)
    const unsub = subscribeToCasesByFiler(user.uid, (list) => {
      setCases(list)
      setCaseCache(list)
      setLoading(false)
    })
    return unsub
  }, [user?.uid, setCaseCache])

  return { cases, loading }
}

// ── Institution case list ─────────────────────────────────────────────────────

export function useInstitutionCases() {
  const { user } = useAuth()
  const [cases, setCases] = useState<CaseMeta[]>([])
  const [loading, setLoading] = useState(true)
  const setCaseCache = useStore((s) => s.setCaseCache)

  useEffect(() => {
    if (!user?.walletAddress) return
    setLoading(true)
    const unsub = subscribeToCasesByInstitution(user.walletAddress, (list) => {
      setCases(list)
      setCaseCache(list)
      setLoading(false)
    })
    return unsub
  }, [user?.walletAddress, setCaseCache])

  return { cases, loading }
}

// ── Single case (GenLayer source of truth + Firestore metadata) ───────────────

export function useCaseDetail(caseId: string) {
  const { user } = useAuth()
  const [chainCase, setChainCase] = useState<Case | null>(null)
  const [meta, setMeta] = useState<CaseMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const getCachedCase = useStore((s) => s.getCachedCase)
  const setCaseCache = useStore((s) => s.setCaseCache)

  function metaToCase(m: CaseMeta): Case {
    return {
      caseId: String(m.caseId || caseId),
      filer: String(m.filerUid || ''),
      institution: String(m.institutionAddress || ''),
      institutionName: String(m.institutionName || ''),
      disputeType: (String(m.disputeType || 'OTHER')) as Case['disputeType'],
      description: String(m.description || ''),
      status: (String(m.status || 'SUBMITTED')) as Case['status'],
      createdAt: typeof m.createdAt === 'number' ? m.createdAt / 1000 : 0,
      updatedAt: typeof m.updatedAt === 'number' ? m.updatedAt / 1000 : 0,
      evidenceHashes: [],
      responseHashes: [],
      judgment: undefined,
      appeal: undefined,
      precedentRefs: [],
      matricNumber: String(m.matricNumber || ''),
      department: String(m.department || ''),
    }
  }

  // After showing fast data (cache/Firestore), enrich with GenLayer in background
  function enrichFromChain(baseCase: Case) {
    contract.getCase(caseId).then((chainData) => {
      // Merge: keep chain data as primary, fall back to base for any missing fields
      setChainCase({
        ...baseCase,
        ...chainData,
        // Prefer non-empty description
        description: chainData.description || baseCase.description,
      })
    }).catch(() => {
      // GenLayer unavailable — base data is already shown, no change needed
    })
  }

  const fetchCase = useCallback(async () => {
    if (!caseId || !user?.uid) return
    setLoading(true)
    setError(null)

    // 1) Try GenLayer first — it has the full case (description, judgment, hashes, etc.)
    try {
      const c = await contract.getCase(caseId)
      setChainCase(c)
      setLoading(false)
      return
    } catch {
      // GenLayer unavailable or case not on-chain yet — fall through to Firestore
    }

    // 2) Check Zustand cache (populated when the cases list was last loaded)
    const cached = getCachedCase(caseId)
    if (cached) {
      setMeta(cached)
      const base = metaToCase(cached)
      setChainCase(base)
      setLoading(false)
      enrichFromChain(base)
      return
    }

    // 3) Firestore: direct doc read (works for everyone now that rules allow authenticated reads)
    try {
      const m = await getCaseMeta(caseId)
      if (m) {
        setMeta(m)
        const base = metaToCase(m)
        setChainCase(base)
        setLoading(false)
        enrichFromChain(base)
        return
      }
    } catch {
      // Fall through
    }

    // 4) Firestore query — role-aware
    try {
      let found: CaseMeta | undefined
      if (user.role === 'INSTITUTION' && user.walletAddress) {
        const cases = await getCasesByInstitution(user.walletAddress)
        if (cases.length > 0) setCaseCache(cases)
        found = cases.find((c) => c.caseId === caseId)
      } else {
        const cases = await getCasesByFiler(user.uid)
        if (cases.length > 0) setCaseCache(cases)
        found = cases.find((c) => c.caseId === caseId)
      }
      if (found) {
        setMeta(found)
        const base = metaToCase(found)
        setChainCase(base)
        setLoading(false)
        enrichFromChain(base)
        return
      }
    } catch {
      // Permission or network error
    }

    setError('Case not found. Please refresh or try again later.')
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, user?.uid, user?.role, user?.walletAddress])

  useEffect(() => {
    fetchCase()
  }, [fetchCase])

  return { case: chainCase, meta, loading, error, refresh: fetchCase }
}

// ── Admin case management ─────────────────────────────────────────────────────

export function useAdminCaseActions() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function getCaller() {
    if (!user?.walletAddress || !user?.walletPrivateKey) throw new Error('Wallet not provisioned')
    return { address: user.walletAddress, privateKey: user.walletPrivateKey }
  }

  const performAction = useCallback(
    async (
      action: () => Promise<unknown>,
      caseId: string,
      newStatus: string,
      notifRecipientUids: string[],
      notifType: Parameters<typeof createNotification>[0]['type'],
      notifMessage: string
    ) => {
      setLoading(true)
      setError(null)
      try {
        // Try GenLayer — if it fails, fall back to Firestore-only update so the UI workflow never gets stuck
        try {
          await action()
        } catch (chainErr) {
          console.warn('[CJP] GenLayer call failed, falling back to Firestore-only update:', chainErr)
        }
        await updateCaseMeta(caseId, { status: newStatus })
        await Promise.all(
          notifRecipientUids
            .filter((uid) => uid)
            .map((uid) =>
              createNotification({
                recipientUid: uid,
                type: notifType,
                caseId,
                message: notifMessage,
              })
            )
        )
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Action failed'
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const verifyCase = useCallback(
    async (caseId: string, filerUid: string) => {
      await performAction(
        () => contract.verifyCase(getCaller(), caseId),
        caseId,
        'VERIFIED',
        [filerUid],
        'CASE_VERIFIED',
        `Your case ${caseId} has been verified and is now under review.`
      )
      // Email student
      try {
        const meta = await getCaseMeta(caseId)
        if (meta?.filerEmail) {
          sendCaseEmail({
            to: meta.filerEmail,
            type: 'CASE_VERIFIED',
            caseId,
            institutionName: meta.institutionName,
            disputeType: meta.disputeType,
          })
        }
      } catch { /* non-fatal */ }
    },
    [user, performAction]
  )

  const notifyInstitution = useCallback(
    async (caseId: string) => {
      setLoading(true)
      setError(null)
      try {
        // Look up institution UID from the case's on-chain data
        const caseData = await contract.getCase(caseId)
        const instUser = await getUserByWalletAddress(caseData.institution)
        const meta = await getCaseMeta(caseId)

        try { await contract.notifyInstitution(getCaller(), caseId) } catch { /* fallback */ }
        await updateCaseMeta(caseId, { status: 'INSTITUTION_NOTIFIED', notificationSent: true })

        // Notify the institution
        if (instUser) {
          await createNotification({
            recipientUid: instUser.uid,
            type: 'CASE_FILED',
            caseId,
            message: `A verified dispute case ${caseId} has been filed against your institution. Please review and respond.`,
          })
          // Also email via saved institutionEmail on case
          const emailTarget = instUser.email || meta?.institutionEmail
          if (emailTarget) {
            sendCaseEmail({
              to: emailTarget,
              type: 'INSTITUTION_NOTIFIED',
              caseId,
              institutionName: meta?.institutionName ?? '',
              disputeType: meta?.disputeType ?? '',
              description: meta?.description,
              studentName: meta?.filerName,
            })
          }
        }

        // Also notify the student that institution has been notified
        if (meta?.filerUid) {
          await createNotification({
            recipientUid: meta.filerUid,
            type: 'CASE_VERIFIED',
            caseId,
            message: `Your case ${caseId} has been forwarded to the institution for response.`,
          })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Action failed'
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  const triggerEvaluation = useCallback(
    async (caseId: string) => {
      setLoading(true)
      setError(null)
      try {
        try { await contract.evaluateCase(getCaller(), caseId) } catch { /* fallback */ }
        await updateCaseMeta(caseId, { status: 'DELIBERATING' })

        // Notify both parties that AI evaluation has started
        const meta = await getCaseMeta(caseId)
        const caseData = await contract.getCase(caseId)
        const instUser = await getUserByWalletAddress(caseData.institution)

        const recipients = [meta?.filerUid, instUser?.uid].filter(Boolean) as string[]
        await Promise.all(
          recipients.map((uid) =>
            createNotification({
              recipientUid: uid,
              type: 'JUDGMENT_ISSUED',
              caseId,
              message: `AI deliberation has started for case ${caseId}. The validator network is now evaluating all evidence.`,
            })
          )
        )
        // Email student judgment is coming
        if (meta?.filerEmail) {
          sendCaseEmail({
            to: meta.filerEmail,
            type: 'JUDGMENT_ISSUED',
            caseId,
            institutionName: meta.institutionName,
            disputeType: meta.disputeType,
          })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Evaluation failed'
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  const triggerAppealEvaluation = useCallback(
    async (caseId: string) => {
      setLoading(true)
      setError(null)
      try {
        try { await contract.evaluateAppeal(getCaller(), caseId) } catch { /* fallback */ }
        await updateCaseMeta(caseId, { status: 'DELIBERATING' })

        const meta = await getCaseMeta(caseId)
        const caseData = await contract.getCase(caseId)
        const instUser = await getUserByWalletAddress(caseData.institution)

        const recipients = [meta?.filerUid, instUser?.uid].filter(Boolean) as string[]
        await Promise.all(
          recipients.map((uid) =>
            createNotification({
              recipientUid: uid,
              type: 'APPEAL_FILED',
              caseId,
              message: `Appeal evaluation has started for case ${caseId}. The validator network is re-evaluating.`,
            })
          )
        )
        // Final judgment email to student
        if (meta?.filerEmail) {
          sendCaseEmail({
            to: meta.filerEmail,
            type: 'FINAL_JUDGMENT',
            caseId,
            institutionName: meta.institutionName,
            disputeType: meta.disputeType,
          })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Appeal evaluation failed'
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  return { verifyCase, notifyInstitution, triggerEvaluation, triggerAppealEvaluation, loading, error }
}

// ── Institution response ──────────────────────────────────────────────────────

export function useInstitutionResponse() {
  const { user } = useAuth()
  const evidence = useEvidence()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitResponse = useCallback(
    async (caseId: string, responseText: string) => {
      if (!user?.walletAddress || !user?.walletPrivateKey) throw new Error('Wallet not provisioned')
      const caller = { address: user.walletAddress, privateKey: user.walletPrivateKey }
      setSubmitting(true)
      setError(null)
      try {
        const uploads = await evidence.uploadAll(caseId, user.uid)
        const hashes = uploads.map((u) => u.hash)

        await contract.submitResponse(caller, caseId, responseText, hashes)

        await updateCaseMeta(caseId, {
          status: 'RESPONDED',
          responseFileUrls: uploads.map((u) => u.url),
        })

        // Look up filer UID from case metadata and notify them
        const meta = await getCaseMeta(caseId)
        if (meta?.filerUid) {
          await createNotification({
            recipientUid: meta.filerUid,
            type: 'RESPONSE_RECEIVED',
            caseId,
            message: `The institution has submitted their response to your case ${caseId}.`,
          })
          if (meta.filerEmail) {
            sendCaseEmail({
              to: meta.filerEmail,
              type: 'RESPONSE_SUBMITTED',
              caseId,
              institutionName: meta.institutionName,
              disputeType: meta.disputeType,
              responseText,
            })
          }
        }

        // Also notify admins so they can trigger evaluation
        try {
          const adminUids = await getAdminUids()
          await Promise.all(
            adminUids.map((adminUid) =>
              createNotification({
                recipientUid: adminUid,
                type: 'RESPONSE_RECEIVED',
                caseId,
                message: `Institution has responded to case ${caseId}. Ready for AI evaluation.`,
              })
            )
          )
        } catch {
          // Non-fatal
        }

        evidence.reset()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Response submission failed'
        setError(msg)
        throw e
      } finally {
        setSubmitting(false)
      }
    },
    [user, evidence]
  )

  return { submitResponse, submitting, error, evidence }
}

// ── Appeal filing ─────────────────────────────────────────────────────────────

export function useAppeal() {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileAppeal = useCallback(
    async (caseId: string, grounds: string) => {
      if (!user?.walletAddress || !user?.walletPrivateKey) throw new Error('Wallet not provisioned')
      const caller = { address: user.walletAddress, privateKey: user.walletPrivateKey }
      setSubmitting(true)
      setError(null)
      try {
        await contract.fileAppeal(caller, caseId, grounds)
        await updateCaseMeta(caseId, { status: 'APPEALED' })

        // Notify institution and admins about the appeal
        const caseData = await contract.getCase(caseId)
        const instUser = await getUserByWalletAddress(caseData.institution)

        if (instUser) {
          await createNotification({
            recipientUid: instUser.uid,
            type: 'APPEAL_FILED',
            caseId,
            message: `The student has filed an appeal for case ${caseId}.`,
          })
          if (instUser.email) {
            sendCaseEmail({
              to: instUser.email,
              type: 'APPEAL_FILED',
              caseId,
              institutionName: caseData.institutionName ?? '',
              disputeType: caseData.disputeType ?? '',
            })
          }
        }

        try {
          const adminUids = await getAdminUids()
          await Promise.all(
            adminUids.map((adminUid) =>
              createNotification({
                recipientUid: adminUid,
                type: 'APPEAL_FILED',
                caseId,
                message: `Appeal filed for case ${caseId}. Ready for appeal evaluation.`,
              })
            )
          )
        } catch {
          // Non-fatal
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Appeal filing failed'
        setError(msg)
        throw e
      } finally {
        setSubmitting(false)
      }
    },
    [user]
  )

  return { fileAppeal, submitting, error }
}
