import React from 'react'
import { render, screen } from '@testing-library/react'
import { AuthGuard } from '../AuthGuard'

const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

import { useAuth } from '@/hooks/useAuth'

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const STUDENT_USER = {
  uid: 'uid-student',
  email: 'student@test.com',
  displayName: 'Test Student',
  role: 'STUDENT' as const,
  walletAddress: undefined,
  matricNumber: '2020/123',
  department: 'CS',
  institutionDomain: undefined,
  createdAt: 0,
}

const INSTITUTION_USER = { ...STUDENT_USER, uid: 'uid-inst', role: 'INSTITUTION' as const }
const ADMIN_USER = { ...STUDENT_USER, uid: 'uid-admin', role: 'ADMIN' as const }

beforeEach(() => {
  mockReplace.mockClear()
})

describe('AuthGuard', () => {
  it('shows loading spinner while loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true } as unknown as ReturnType<typeof useAuth>)
    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>
    )
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).toBeNull()
  })

  it('redirects to /login when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false } as unknown as ReturnType<typeof useAuth>)
    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>
    )
    expect(mockReplace).toHaveBeenCalledWith('/login')
    expect(screen.queryByText('Protected content')).toBeNull()
  })

  it('renders children when authenticated with no requiredRole', () => {
    mockUseAuth.mockReturnValue({ user: STUDENT_USER, loading: false } as unknown as ReturnType<typeof useAuth>)
    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>
    )
    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('renders children when role matches requiredRole', () => {
    mockUseAuth.mockReturnValue({ user: STUDENT_USER, loading: false } as unknown as ReturnType<typeof useAuth>)
    render(
      <AuthGuard requiredRole="STUDENT">
        <p>Student content</p>
      </AuthGuard>
    )
    expect(screen.getByText('Student content')).toBeInTheDocument()
  })

  it('redirects student to /student/dashboard when INSTITUTION role required', () => {
    mockUseAuth.mockReturnValue({ user: STUDENT_USER, loading: false } as unknown as ReturnType<typeof useAuth>)
    render(
      <AuthGuard requiredRole="INSTITUTION">
        <p>Institution content</p>
      </AuthGuard>
    )
    expect(mockReplace).toHaveBeenCalledWith('/student/dashboard')
    expect(screen.queryByText('Institution content')).toBeNull()
  })

  it('redirects institution to /institution/dashboard when STUDENT role required', () => {
    mockUseAuth.mockReturnValue({ user: INSTITUTION_USER, loading: false } as unknown as ReturnType<typeof useAuth>)
    render(
      <AuthGuard requiredRole="STUDENT">
        <p>Student content</p>
      </AuthGuard>
    )
    expect(mockReplace).toHaveBeenCalledWith('/institution/dashboard')
  })

  it('redirects admin to /admin/portal when STUDENT role required', () => {
    mockUseAuth.mockReturnValue({ user: ADMIN_USER, loading: false } as unknown as ReturnType<typeof useAuth>)
    render(
      <AuthGuard requiredRole="STUDENT">
        <p>Student content</p>
      </AuthGuard>
    )
    expect(mockReplace).toHaveBeenCalledWith('/admin/portal')
  })

  it('renders INSTITUTION user content when INSTITUTION required', () => {
    mockUseAuth.mockReturnValue({ user: INSTITUTION_USER, loading: false } as unknown as ReturnType<typeof useAuth>)
    render(
      <AuthGuard requiredRole="INSTITUTION">
        <p>Institution content</p>
      </AuthGuard>
    )
    expect(screen.getByText('Institution content')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('renders ADMIN user content when ADMIN required', () => {
    mockUseAuth.mockReturnValue({ user: ADMIN_USER, loading: false } as unknown as ReturnType<typeof useAuth>)
    render(
      <AuthGuard requiredRole="ADMIN">
        <p>Admin portal</p>
      </AuthGuard>
    )
    expect(screen.getByText('Admin portal')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
