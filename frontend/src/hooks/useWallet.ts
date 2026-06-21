'use client'

import { useEffect } from 'react'
import { useStore } from '@/store'
import { useAuth } from './useAuth'

export function useWallet() {
  const { address, setAddress, setConnected } = useStore()
  const { user } = useAuth()

  // Sync the embedded wallet address from the user profile
  useEffect(() => {
    if (user?.walletAddress) {
      setAddress(user.walletAddress)
      setConnected(true)
    } else {
      setAddress(null)
      setConnected(false)
    }
  }, [user?.walletAddress, setAddress, setConnected])

  const displayAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : ''

  return {
    address,
    connected: !!address,
    displayAddress,
  }
}
