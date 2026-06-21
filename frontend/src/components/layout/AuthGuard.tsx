'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types'
import { Scale } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (requiredRole && user.role !== requiredRole) {
      const redirect =
        user.role === 'STUDENT' ? '/student/dashboard'
        : user.role === 'INSTITUTION' ? '/institution/dashboard'
        : '/admin/portal'
      router.replace(redirect)
    }
  }, [user, loading, requiredRole, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center animate-pulse">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return null
  if (requiredRole && user.role !== requiredRole) return null

  return <>{children}</>
}
