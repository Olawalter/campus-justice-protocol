'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FilePlus,
  FolderOpen,
  Library,
  BarChart3,
  Bell,
  Settings,
  Scale,
  ShieldCheck,
  Users,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/useNotifications'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badgeKey?: 'notifications'
}

const studentNav: NavItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'File Dispute', href: '/student/file-dispute', icon: FilePlus },
  { label: 'My Cases', href: '/student/cases', icon: FolderOpen },
  { label: 'Precedents', href: '/precedents', icon: Library },
  { label: 'Transparency', href: '/transparency', icon: BarChart3 },
  { label: 'Notifications', href: '/notifications', icon: Bell, badgeKey: 'notifications' },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const institutionNav: NavItem[] = [
  { label: 'Dashboard', href: '/institution/dashboard', icon: LayoutDashboard },
  { label: 'Cases', href: '/institution/cases', icon: FolderOpen },
  { label: 'Precedents', href: '/precedents', icon: Library },
  { label: 'Transparency', href: '/transparency', icon: BarChart3 },
  { label: 'Notifications', href: '/notifications', icon: Bell, badgeKey: 'notifications' },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const adminNav: NavItem[] = [
  { label: 'Portal', href: '/admin/portal', icon: ShieldCheck },
  { label: 'All Cases', href: '/admin/cases', icon: FolderOpen },
  { label: 'Institutions', href: '/admin/institutions', icon: Users },
  { label: 'Transparency', href: '/transparency', icon: BarChart3 },
  { label: 'Notifications', href: '/notifications', icon: Bell, badgeKey: 'notifications' },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  role: 'student' | 'institution' | 'admin'
  open: boolean
  onClose: () => void
}

export function Sidebar({ role, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()
  const navItems = role === 'student' ? studentNav : role === 'institution' ? institutionNav : adminNav

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Scale className="h-4 w-4 text-white" />
          </div>
          <span className="font-heading font-bold text-sm">Campus Justice</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-border">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {role} Portal
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const badgeValue = item.badgeKey === 'notifications' && unreadCount > 0 ? unreadCount : null
          return (
            <Link key={item.href} href={item.href} onClick={() => {
              if (window.innerWidth < 768) onClose()
            }}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all',
                  active
                    ? 'bg-secondary text-white font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {badgeValue && (
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    active ? 'bg-white/20 text-white' : 'bg-secondary/10 text-secondary'
                  )}>
                    {badgeValue > 9 ? '9+' : badgeValue}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Powered by GenLayer
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: open ? 240 : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:block shrink-0 overflow-hidden border-r border-border bg-card h-screen sticky top-0"
      >
        <div className="w-60">{sidebarContent}</div>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed left-0 top-0 h-full w-60 bg-card border-r border-border z-50 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
