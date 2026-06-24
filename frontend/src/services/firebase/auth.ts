import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'
import { UserProfile, UserRole } from '@/types'
import { generatePrivateKey, createAccount } from 'genlayer-js'

function generateEmbeddedWallet(): { address: string; privateKey: `0x${string}` } {
  const privateKey = generatePrivateKey()
  const account = createAccount(privateKey)
  return { address: account.address, privateKey }
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
  extra: { matricNumber?: string; department?: string; institutionId?: string; domain?: string } = {}
): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const { user } = credential

  await updateProfile(user, { displayName })

  const wallet = generateEmbeddedWallet()

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    role,
    displayName,
    walletAddress: wallet.address,
    walletPrivateKey: wallet.privateKey,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...extra,
  }

  await setDoc(doc(db, 'users', user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Register on-chain so the contract recognizes this wallet
  try {
    await fetch('/api/register-on-chain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: wallet.address, role }),
    })
  } catch {
    // Non-fatal: user can still use the app; admin can register manually later
  }

  return profile
}

export async function loginUser(email: string, password: string): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const profile = await getUserProfile(credential.user.uid)
  if (!profile) throw new Error('User profile not found. Please contact support.')

  // Ensure existing users are registered on-chain (idempotent)
  if (profile.walletAddress) {
    fetch('/api/register-on-chain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: profile.walletAddress, role: profile.role }),
    }).catch(() => {})
  }

  return profile
}

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid: snap.id,
    email: data.email,
    role: data.role,
    displayName: data.displayName,
    walletAddress: data.walletAddress,
    walletPrivateKey: data.walletPrivateKey as `0x${string}` | undefined,
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? 0,
    updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt ?? 0,
    matricNumber: data.matricNumber,
    department: data.department,
    institutionId: data.institutionId,
    institutionName: data.institutionName,
    domain: data.domain,
    verified: data.verified,
  }
}

export async function linkWallet(uid: string, walletAddress: string): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { walletAddress, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}
