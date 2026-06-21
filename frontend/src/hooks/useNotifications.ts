'use client'

import { useEffect, useState } from 'react'
import { subscribeToNotifications, markNotificationRead, Notification } from '@/services/firebase/firestore'
import { useAuth } from './useAuth'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!user?.uid) return
    const unsub = subscribeToNotifications(user.uid, setNotifications)
    return unsub
  }, [user?.uid])

  const markRead = async (id: string) => {
    await markNotificationRead(id)
  }

  const markAllRead = async () => {
    await Promise.all(
      notifications.filter((n) => !n.read).map((n) => markNotificationRead(n.id!))
    )
  }

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markRead,
    markAllRead,
  }
}
