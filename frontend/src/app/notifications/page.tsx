'use client'

import { Bell, CheckCheck, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import Link from 'next/link'

const typeLabel: Record<string, string> = {
  CASE_FILED: 'Case Filed',
  CASE_VERIFIED: 'Case Verified',
  RESPONSE_RECEIVED: 'Response Received',
  JUDGMENT_ISSUED: 'Judgment Issued',
  APPEAL_FILED: 'Appeal Filed',
  FINAL_JUDGMENT: 'Final Judgment',
}

const typeColor: Record<string, string> = {
  CASE_FILED: 'bg-blue-500',
  CASE_VERIFIED: 'bg-violet-500',
  RESPONSE_RECEIVED: 'bg-amber-500',
  JUDGMENT_ISSUED: 'bg-emerald-500',
  APPEAL_FILED: 'bg-rose-500',
  FINAL_JUDGMENT: 'bg-secondary',
}

function NotificationsContent() {
  const { user } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  const role = user?.role === 'STUDENT' ? 'student' : user?.role === 'INSTITUTION' ? 'institution' : 'admin'

  return (
    <PageWrapper role={role} userName={user?.displayName}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:border-secondary/40',
                  n.read
                    ? 'bg-card border-border'
                    : 'bg-secondary/5 border-secondary/20'
                )}
                onClick={() => { if (!n.read && n.id) markRead(n.id) }}
              >
                <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', typeColor[n.type] ?? 'bg-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {typeLabel[n.type] ?? n.type}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {n.createdAt ? formatDate(n.createdAt / 1000) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1">{n.message}</p>
                  <Link
                    href={`/${role}/cases/${n.caseId}`}
                    className="text-xs text-secondary hover:underline mt-1 inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FolderOpen className="h-3 w-3" />
                    View {n.caseId}
                  </Link>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  )
}
