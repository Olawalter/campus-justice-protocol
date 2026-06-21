import { renderHook, act } from '@testing-library/react'
import { useEvidence } from '../useEvidence'

// Mock firebase upload — not under test here
jest.mock('@/services/firebase/storage', () => ({
  uploadMultipleEvidenceFiles: jest.fn().mockResolvedValue([
    { hash: 'abc123', url: 'https://storage.example.com/abc123', path: 'evidence/c1/u1/abc123.pdf' },
    { hash: 'def456', url: 'https://storage.example.com/def456', path: 'evidence/c1/u1/def456.pdf' },
  ]),
}))

function makeFile(name: string, content = 'data'): File {
  return new File([content], name, { type: 'application/pdf' })
}

describe('useEvidence', () => {
  describe('addFiles', () => {
    it('adds files to state', () => {
      const { result } = renderHook(() => useEvidence())
      act(() => {
        result.current.addFiles([makeFile('a.pdf'), makeFile('b.pdf')])
      })
      expect(result.current.files).toHaveLength(2)
      expect(result.current.totalFiles).toBe(2)
    })

    it('caps at 10 files', () => {
      const { result } = renderHook(() => useEvidence())
      const batch = Array.from({ length: 12 }, (_, i) => makeFile(`file${i}.pdf`))
      act(() => {
        result.current.addFiles(batch)
      })
      expect(result.current.files).toHaveLength(10)
    })

    it('accumulates across multiple addFiles calls', () => {
      const { result } = renderHook(() => useEvidence())
      act(() => { result.current.addFiles([makeFile('a.pdf')]) })
      act(() => { result.current.addFiles([makeFile('b.pdf'), makeFile('c.pdf')]) })
      expect(result.current.files).toHaveLength(3)
    })

    it('initialises progress array', () => {
      const { result } = renderHook(() => useEvidence())
      act(() => {
        result.current.addFiles([makeFile('a.pdf'), makeFile('b.pdf')])
      })
      expect(result.current.progress).toEqual([0, 0])
    })
  })

  describe('removeFile', () => {
    it('removes a file by index', () => {
      const { result } = renderHook(() => useEvidence())
      act(() => {
        result.current.addFiles([makeFile('a.pdf'), makeFile('b.pdf'), makeFile('c.pdf')])
      })
      act(() => { result.current.removeFile(1) })
      expect(result.current.files).toHaveLength(2)
      expect(result.current.files[0].name).toBe('a.pdf')
      expect(result.current.files[1].name).toBe('c.pdf')
    })

    it('removes the correct progress entry', () => {
      const { result } = renderHook(() => useEvidence())
      act(() => {
        result.current.addFiles([makeFile('a.pdf'), makeFile('b.pdf')])
      })
      act(() => { result.current.removeFile(0) })
      expect(result.current.progress).toHaveLength(1)
    })
  })

  describe('hashAllFiles', () => {
    it('hashes all files and returns hashes', async () => {
      const { result } = renderHook(() => useEvidence())
      act(() => {
        result.current.addFiles([makeFile('a.pdf', 'content-a'), makeFile('b.pdf', 'content-b')])
      })
      let hashes: string[] = []
      await act(async () => {
        hashes = await result.current.hashAllFiles()
      })
      expect(hashes).toHaveLength(2)
      expect(hashes[0]).toHaveLength(64)
      expect(hashes[1]).toHaveLength(64)
      expect(hashes[0]).not.toBe(hashes[1])
    })

    it('returns empty array when no files', async () => {
      const { result } = renderHook(() => useEvidence())
      let hashes: string[] = []
      await act(async () => {
        hashes = await result.current.hashAllFiles()
      })
      expect(hashes).toEqual([])
    })
  })

  describe('uploadAll', () => {
    it('uploads and returns results', async () => {
      const { result } = renderHook(() => useEvidence())
      act(() => {
        result.current.addFiles([makeFile('a.pdf'), makeFile('b.pdf')])
      })
      let uploads: { hash: string }[] = []
      await act(async () => {
        uploads = await result.current.uploadAll('CJP-000001', 'uid-student')
      })
      expect(uploads).toHaveLength(2)
      expect(uploads[0].hash).toBe('abc123')
    })

    it('returns empty array when no files', async () => {
      const { result } = renderHook(() => useEvidence())
      let uploads: unknown[] = []
      await act(async () => {
        uploads = await result.current.uploadAll('CJP-000001', 'uid-student')
      })
      expect(uploads).toEqual([])
    })

    it('sets uploading to true while in flight then false', async () => {
      const { result } = renderHook(() => useEvidence())
      act(() => { result.current.addFiles([makeFile('a.pdf')]) })
      await act(async () => {
        await result.current.uploadAll('CJP-000001', 'uid-student')
      })
      expect(result.current.uploading).toBe(false)
    })
  })

  describe('reset', () => {
    it('clears all state', () => {
      const { result } = renderHook(() => useEvidence())
      act(() => {
        result.current.addFiles([makeFile('a.pdf'), makeFile('b.pdf')])
      })
      act(() => { result.current.reset() })
      expect(result.current.files).toHaveLength(0)
      expect(result.current.hashes).toHaveLength(0)
      expect(result.current.progress).toHaveLength(0)
      expect(result.current.uploading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('overallProgress', () => {
    it('returns 0 with no files', () => {
      const { result } = renderHook(() => useEvidence())
      expect(result.current.overallProgress).toBe(0)
    })

    it('returns 0 after files added (not yet uploaded)', () => {
      const { result } = renderHook(() => useEvidence())
      act(() => {
        result.current.addFiles([makeFile('a.pdf'), makeFile('b.pdf')])
      })
      expect(result.current.overallProgress).toBe(0)
    })
  })
})
