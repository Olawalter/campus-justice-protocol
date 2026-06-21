'use client'

import { useEffect, useState, useCallback, startTransition } from 'react'
import { useStore } from '@/store'
import {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  getUserProfile,
  subscribeToAuthState,
} from '@/services/firebase/auth'
import { UserRole } from '@/types'

export function useAuth() {
  const { user, loading, setUser, setLoading } = useStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid)
        startTransition(() => {
          setUser(profile)
          setLoading(false)
        })
      } else {
        startTransition(() => {
          setUser(null)
          setLoading(false)
        })
      }
    })
    return unsub
  }, [setUser, setLoading])

  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: UserRole,
      extra?: { matricNumber?: string; department?: string; institutionId?: string }
    ) => {
      setError(null)
      setLoading(true)
      try {
        const profile = await registerUser(email, password, displayName, role, extra)
        setUser(profile)
        return profile
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Registration failed'
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [setUser, setLoading]
  )

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null)
      setLoading(true)
      try {
        const profile = await loginUser(email, password)
        setUser(profile)
        return profile
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Login failed'
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [setUser, setLoading]
  )

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
  }, [setUser])

  const sendReset = useCallback(async (email: string) => {
    setError(null)
    try {
      await resetPassword(email)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send reset email'
      setError(msg)
      throw e
    }
  }, [])

  return {
    user,
    loading,
    error,
    isAdmin: user?.role === 'ADMIN',
    isStudent: user?.role === 'STUDENT',
    isInstitution: user?.role === 'INSTITUTION',
    isAuthenticated: !!user,
    register,
    login,
    logout,
    sendReset,
  }
}
