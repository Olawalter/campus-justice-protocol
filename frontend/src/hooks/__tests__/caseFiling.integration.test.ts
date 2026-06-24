/**
 * Integration test for the case filing flow.
 * Tests useCaseFiling coordinates:
 *   1. Hash evidence files client-side
 *   2. Call GenLayer createCase with hashed evidence
 *   3. Upload files to Firebase Storage
 *   4. Save metadata to Firestore
 */
import { renderHook, act } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCreateCase = jest.fn().mockResolvedValue({ success: true, hash: 'CJP-000042' })
const mockUploadMultiple = jest.fn().mockResolvedValue([
  { hash: 'aabbcc', url: 'https://storage.example.com/aabbcc', path: 'ev/c/u/aabbcc.pdf' },
])
const mockSaveCaseMeta = jest.fn().mockResolvedValue(undefined)

jest.mock('@/services/genlayer/contract', () => ({
  createCase: (...args: unknown[]) => mockCreateCase(...args),
  getAllInstitutions: jest.fn().mockResolvedValue([]),
}))

jest.mock('@/services/firebase/storage', () => ({
  uploadMultipleEvidenceFiles: (...args: unknown[]) => mockUploadMultiple(...args),
}))

jest.mock('@/services/firebase/firestore', () => ({
  saveCaseMeta: (...args: unknown[]) => mockSaveCaseMeta(...args),
  updateCaseMeta: jest.fn(),
  getCaseMeta: jest.fn(),
  subscribeToCasesByFiler: jest.fn(() => () => {}),
  subscribeToCasesByInstitution: jest.fn(() => () => {}),
  createNotification: jest.fn(),
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'uid-student',
      email: 'student@test.com',
      displayName: 'Test Student',
      role: 'STUDENT',
      walletAddress: '0xSTUDENT01',
    },
    loading: false,
  }),
}))

import { useCaseFiling } from '../useCase'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFile(name: string, content = 'pdf-data'): File {
  return new File([content], name, { type: 'application/pdf' })
}

const SUBMIT_ARGS = {
  institution: '0xINST01', institutionName: 'Test University', institutionEmail: 'registrar@test.edu',
  disputeType: 'GPA_MISCALCULATION' as const,
  description: 'My GPA was incorrectly computed in semester 2 due to a data entry error by the registrar.',
  matricNumber: '2020/12345',
  department: 'Computer Science',
  evidenceFiles: [] as File[],
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Case filing integration', () => {
  beforeEach(() => {
    mockCreateCase.mockClear()
    mockUploadMultiple.mockClear()
    mockSaveCaseMeta.mockClear()
    mockCreateCase.mockResolvedValue({ success: true, hash: 'CJP-000042' })
  })

  it('returns the case ID from GenLayer on success', async () => {
    const { result } = renderHook(() => useCaseFiling())
    act(() => { result.current.evidence.addFiles([makeFile('transcript.pdf')]) })

    let caseId: string | null = null
    await act(async () => {
      caseId = await result.current.submitCase(SUBMIT_ARGS)
    })

    expect(caseId).toBe('CJP-000042')
  })

  it('calls createCase with the filer wallet address', async () => {
    const { result } = renderHook(() => useCaseFiling())
    act(() => { result.current.evidence.addFiles([makeFile('doc.pdf', 'unique-content-abc')]) })
    await act(async () => { await result.current.submitCase(SUBMIT_ARGS) })

    expect(mockCreateCase).toHaveBeenCalledTimes(1)
    const [walletArg, inputArg] = mockCreateCase.mock.calls[0]
    expect(walletArg).toBe('0xSTUDENT01')
    expect(inputArg.institutionAddress).toBe('0xINST01')
    expect(inputArg.disputeType).toBe('GPA_MISCALCULATION')
  })

  it('passes evidence hashes as an array to the contract', async () => {
    const { result } = renderHook(() => useCaseFiling())
    act(() => { result.current.evidence.addFiles([makeFile('doc.pdf', 'unique-content')]) })
    await act(async () => { await result.current.submitCase(SUBMIT_ARGS) })

    const [, inputArg] = mockCreateCase.mock.calls[0]
    expect(Array.isArray(inputArg.evidenceHashes)).toBe(true)
    expect(inputArg.evidenceHashes[0]).toHaveLength(64) // SHA-256 hex
  })

  it('saves case metadata to Firestore after GenLayer success', async () => {
    const { result } = renderHook(() => useCaseFiling())
    act(() => { result.current.evidence.addFiles([makeFile('a.pdf')]) })
    await act(async () => { await result.current.submitCase(SUBMIT_ARGS) })

    expect(mockSaveCaseMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: 'CJP-000042',
        filerUid: 'uid-student',
        institutionAddress: '0xINST01',
        disputeType: 'GPA_MISCALCULATION',
        status: 'SUBMITTED',
      })
    )
  })

  it('uploads evidence files to Firebase Storage after GenLayer success', async () => {
    const { result } = renderHook(() => useCaseFiling())
    act(() => { result.current.evidence.addFiles([makeFile('a.pdf')]) })
    await act(async () => { await result.current.submitCase(SUBMIT_ARGS) })

    expect(mockUploadMultiple).toHaveBeenCalledWith(
      expect.any(Array),
      'CJP-000042',
      'uid-student',
      expect.any(Function)
    )
  })

  it('starts not-submitting and ends not-submitting', async () => {
    const { result } = renderHook(() => useCaseFiling())
    expect(result.current.submitting).toBe(false)
    act(() => { result.current.evidence.addFiles([makeFile('a.pdf')]) })
    await act(async () => { await result.current.submitCase(SUBMIT_ARGS) })
    expect(result.current.submitting).toBe(false)
  })

  it('surfaces an error when GenLayer returns failure', async () => {
    mockCreateCase.mockResolvedValueOnce({ success: false, error: 'Contract execution failed' })
    const { result } = renderHook(() => useCaseFiling())
    act(() => { result.current.evidence.addFiles([makeFile('a.pdf')]) })

    await act(async () => {
      try { await result.current.submitCase(SUBMIT_ARGS) } catch {}
    })

    expect(result.current.error).toMatch(/Contract call failed|Contract execution failed/)
    expect(result.current.submitting).toBe(false)
  })

  it('surfaces an error when GenLayer throws', async () => {
    mockCreateCase.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useCaseFiling())
    act(() => { result.current.evidence.addFiles([makeFile('a.pdf')]) })

    await act(async () => {
      try { await result.current.submitCase(SUBMIT_ARGS) } catch {}
    })

    expect(result.current.error).toMatch(/Network error/)
    expect(result.current.submitting).toBe(false)
  })

  it('does not upload if no evidence files attached', async () => {
    const { result } = renderHook(() => useCaseFiling())
    await act(async () => { await result.current.submitCase(SUBMIT_ARGS) })
    expect(mockUploadMultiple).not.toHaveBeenCalled()
  })
})
