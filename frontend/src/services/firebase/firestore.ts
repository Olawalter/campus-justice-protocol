import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { UserProfile } from '@/types'

// ── User profiles ─────────────────────────────────────────────────────────────

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await setDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

// ── Case metadata (off-chain cache, NOT source of truth) ──────────────────────

export interface CaseMeta {
  caseId: string
  filerUid: string
  filerName: string
  filerEmail: string
  institutionAddress: string
  institutionName: string
  institutionEmail: string
  disputeType: string
  description: string
  status: string
  createdAt: number
  updatedAt: number
  evidenceFileUrls: string[]
  responseFileUrls: string[]
  matricNumber: string
  department: string
  notificationSent: boolean
  appealGrounds?: string
  judgment?: {
    outcome: string
    reasoning: string
    evidenceSummary: string
    confidenceScore: number
    issuedAt: number
  }
  appealJudgment?: {
    outcome: string
    reasoning: string
    evidenceSummary: string
    confidenceScore: number
    issuedAt: number
  }
}

export async function saveCaseMeta(meta: CaseMeta): Promise<void> {
  await setDoc(doc(db, 'cases', meta.caseId), {
    ...meta,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateCaseMeta(caseId: string, data: Partial<CaseMeta>): Promise<void> {
  await setDoc(
    doc(db, 'cases', caseId),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export async function getCaseMeta(caseId: string): Promise<CaseMeta | null> {
  // Try direct doc read first (works when rules allow it)
  try {
    const snap = await getDoc(doc(db, 'cases', caseId))
    if (snap.exists()) return normalizeCaseMeta(snap.id, snap.data())
  } catch {
    // Permission denied — fall through to query approach
  }
  return null
}

export async function getCaseMetaForUser(caseId: string, uid: string): Promise<CaseMeta | null> {
  // Query-based lookup that works with restrictive security rules
  // because the where('filerUid') constraint matches the rule
  const q = query(
    collection(db, 'cases'),
    where('filerUid', '==', uid),
    limit(50)
  )
  try {
    const snap = await getDocs(q)
    const match = snap.docs.find((d) => d.id === caseId)
    if (match) return normalizeCaseMeta(match.id, match.data())
  } catch {
    // Query also failed
  }
  return null
}

export async function getCasesByFiler(filerUid: string): Promise<CaseMeta[]> {
  const q = query(
    collection(db, 'cases'),
    where('filerUid', '==', filerUid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => normalizeCaseMeta(d.id, d.data()))
}

export async function getCasesByInstitution(institutionAddress: string): Promise<CaseMeta[]> {
  const q = query(
    collection(db, 'cases'),
    where('institutionAddress', '==', institutionAddress),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => normalizeCaseMeta(d.id, d.data()))
}

export async function getCasesByStatus(status: string, limitCount = 50): Promise<CaseMeta[]> {
  const q = query(
    collection(db, 'cases'),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => normalizeCaseMeta(d.id, d.data()))
}

export function subscribeToCaseMeta(caseId: string, cb: (meta: CaseMeta | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'cases', caseId), (snap) => {
    cb(snap.exists() ? normalizeCaseMeta(snap.id, snap.data()) : null)
  })
}

export function subscribeToCasesByFiler(filerUid: string, cb: (cases: CaseMeta[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'cases'),
    where('filerUid', '==', filerUid),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => normalizeCaseMeta(d.id, d.data())))
  }, () => {
    cb([])
  })
}

export function subscribeToCasesByInstitution(
  institutionAddress: string,
  cb: (cases: CaseMeta[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'cases'),
    where('institutionAddress', '==', institutionAddress),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => normalizeCaseMeta(d.id, d.data())))
  }, () => {
    cb([])
  })
}

// ── User lookups ─────────────────────────────────────────────────────────────

export async function getUserByWalletAddress(walletAddress: string): Promise<{ uid: string; displayName: string; email?: string } | null> {
  const q = query(
    collection(db, 'users'),
    where('walletAddress', '==', walletAddress),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { uid: d.id, displayName: d.data().displayName ?? '', email: d.data().email }
}

export async function getUserByInstitutionId(institutionId: string): Promise<{ uid: string; displayName: string; email?: string } | null> {
  const q = query(
    collection(db, 'users'),
    where('institutionId', '==', institutionId),
    where('role', '==', 'INSTITUTION'),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { uid: d.id, displayName: d.data().displayName ?? '', email: d.data().email }
}

export async function getUserEmail(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data().email ?? null) : null
}

export async function getAdminUids(): Promise<string[]> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'ADMIN')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.id)
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface Notification {
  id?: string
  recipientUid: string
  type: 'CASE_FILED' | 'CASE_VERIFIED' | 'RESPONSE_RECEIVED' | 'JUDGMENT_ISSUED' | 'APPEAL_FILED' | 'FINAL_JUDGMENT'
  caseId: string
  message: string
  read: boolean
  createdAt: number
}

export async function createNotification(n: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> {
  const ref = doc(collection(db, 'notifications'))
  await setDoc(ref, { ...n, read: false, createdAt: serverTimestamp() })
}

export async function markNotificationRead(notifId: string): Promise<void> {
  await setDoc(doc(db, 'notifications', notifId), { read: true }, { merge: true })
}

export function subscribeToNotifications(
  recipientUid: string,
  cb: (notifications: Notification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', recipientUid),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Notification, 'id'>),
        createdAt: d.data().createdAt?.toMillis?.() ?? d.data().createdAt ?? 0,
      }))
    )
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object' && 'toString' in v) return String(v)
  return JSON.stringify(v)
}

function toMs(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'object' && v !== null && 'toMillis' in v && typeof (v as { toMillis: () => number }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis()
  }
  if (typeof v === 'object' && v !== null && 'seconds' in v) {
    return ((v as { seconds: number }).seconds ?? 0) * 1000
  }
  return Number(v) || 0
}

function normalizeCaseMeta(id: string, data: DocumentData): CaseMeta {
  return {
    caseId: toStr(id),
    filerUid: toStr(data.filerUid),
    filerName: toStr(data.filerName),
    filerEmail: toStr(data.filerEmail),
    institutionAddress: toStr(data.institutionAddress),
    institutionName: toStr(data.institutionName),
    institutionEmail: toStr(data.institutionEmail),
    disputeType: toStr(data.disputeType),
    description: toStr(data.description),
    status: toStr(data.status) || 'SUBMITTED',
    createdAt: toMs(data.createdAt),
    updatedAt: toMs(data.updatedAt),
    evidenceFileUrls: Array.isArray(data.evidenceFileUrls) ? data.evidenceFileUrls : [],
    responseFileUrls: Array.isArray(data.responseFileUrls) ? data.responseFileUrls : [],
    matricNumber: toStr(data.matricNumber),
    department: toStr(data.department),
    notificationSent: !!data.notificationSent,
  }
}
