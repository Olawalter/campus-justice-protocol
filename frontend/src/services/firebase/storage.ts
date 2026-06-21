import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from 'firebase/storage'
import { storage } from '@/config/firebase'
import { hashFile } from '@/utils/hash'
import { ALLOWED_EVIDENCE_TYPES, MAX_EVIDENCE_FILE_SIZE } from '@/config/constants'

export interface UploadResult {
  url: string
  hash: string
  fileName: string
  size: number
  mimeType: string
}

export type UploadProgressCallback = (progress: number) => void

export async function uploadEvidenceFile(
  file: File,
  caseId: string,
  uploaderUid: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  if (!ALLOWED_EVIDENCE_TYPES.includes(file.type)) {
    throw new Error(`File type not allowed: ${file.type}`)
  }
  if (file.size > MAX_EVIDENCE_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is 10MB.`)
  }

  const hash = await hashFile(file)
  const ext = file.name.split('.').pop() ?? 'bin'
  const storagePath = `evidence/${caseId}/${uploaderUid}/${hash}.${ext}`
  const storageRef = ref(storage, storagePath)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        caseId,
        uploaderUid,
        originalName: file.name,
        sha256: hash,
      },
    })

    task.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(Math.round(progress))
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({
          url,
          hash,
          fileName: file.name,
          size: file.size,
          mimeType: file.type,
        })
      }
    )
  })
}

export async function uploadMultipleEvidenceFiles(
  files: File[],
  caseId: string,
  uploaderUid: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  for (let i = 0; i < files.length; i++) {
    const result = await uploadEvidenceFile(files[i], caseId, uploaderUid, (p) =>
      onProgress?.(i, p)
    )
    results.push(result)
  }
  return results
}

export async function deleteEvidenceFile(storagePath: string): Promise<void> {
  await deleteObject(ref(storage, storagePath))
}
