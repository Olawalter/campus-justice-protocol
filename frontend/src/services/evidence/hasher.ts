import { hashFile, hashFiles } from '@/utils/hash'
import { storage } from '@/config/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export interface EvidenceUploadResult {
  hash: string
  fileUrl: string
  fileName: string
}

export async function uploadAndHashEvidence(
  file: File,
  userId: string,
  caseId: string
): Promise<EvidenceUploadResult> {
  // 1. Hash client-side before upload
  const hash = await hashFile(file)

  // 2. Upload to Firebase Storage
  const storagePath = `evidence/${userId}/${caseId}/${hash}_${file.name}`
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: { sha256: hash, originalName: file.name },
  })

  // 3. Get download URL
  const fileUrl = await getDownloadURL(storageRef)

  return { hash, fileUrl, fileName: file.name }
}

export async function uploadAndHashMultiple(
  files: File[],
  userId: string,
  caseId: string
): Promise<EvidenceUploadResult[]> {
  return Promise.all(
    files.map((file) => uploadAndHashEvidence(file, userId, caseId))
  )
}

export { hashFile, hashFiles }
