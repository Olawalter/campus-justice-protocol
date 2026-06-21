'use client'

import { useState, useCallback } from 'react'
import { uploadMultipleEvidenceFiles, UploadResult } from '@/services/firebase/storage'
import { hashFiles } from '@/utils/hash'

export interface EvidenceUploadState {
  files: File[]
  previews: string[]
  hashes: string[]
  uploads: UploadResult[]
  uploading: boolean
  progress: number[]
  error: string | null
}

const initialState: EvidenceUploadState = {
  files: [],
  previews: [],
  hashes: [],
  uploads: [],
  uploading: false,
  progress: [],
  error: null,
}

export function useEvidence() {
  const [state, setState] = useState<EvidenceUploadState>(initialState)

  const addFiles = useCallback((incoming: File[]) => {
    setState((prev) => {
      const combined = [...prev.files, ...incoming].slice(0, 10)
      const previews = combined.map((f) =>
        f.type.startsWith('image/') ? URL.createObjectURL(f) : ''
      )
      return { ...prev, files: combined, previews, progress: combined.map(() => 0) }
    })
  }, [])

  const removeFile = useCallback((index: number) => {
    setState((prev) => {
      const files = prev.files.filter((_, i) => i !== index)
      const previews = prev.previews.filter((_, i) => i !== index)
      const progress = prev.progress.filter((_, i) => i !== index)
      return { ...prev, files, previews, progress }
    })
  }, [])

  const hashAllFiles = useCallback(async (): Promise<string[]> => {
    const hashes = await hashFiles(state.files)
    setState((prev) => ({ ...prev, hashes }))
    return hashes
  }, [state.files])

  const uploadAll = useCallback(
    async (caseId: string, uploaderUid: string): Promise<UploadResult[]> => {
      if (!state.files.length) return []
      setState((prev) => ({ ...prev, uploading: true, error: null }))
      try {
        const results = await uploadMultipleEvidenceFiles(
          state.files,
          caseId,
          uploaderUid,
          (fileIndex, pct) => {
            setState((prev) => {
              const progress = [...prev.progress]
              progress[fileIndex] = pct
              return { ...prev, progress }
            })
          }
        )
        const hashes = results.map((r) => r.hash)
        setState((prev) => ({ ...prev, uploads: results, hashes, uploading: false }))
        return results
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Upload failed'
        setState((prev) => ({ ...prev, uploading: false, error: msg }))
        throw e
      }
    },
    [state.files]
  )

  const reset = useCallback(() => setState(initialState), [])

  return {
    ...state,
    addFiles,
    removeFile,
    hashAllFiles,
    uploadAll,
    reset,
    totalFiles: state.files.length,
    overallProgress:
      state.progress.length > 0
        ? Math.round(state.progress.reduce((a, b) => a + b, 0) / state.progress.length)
        : 0,
  }
}
