'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Scale, Bell, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'

interface NavbarProps {
  role?: 'student' | 'institution' | 'admin' | null
  userName?: string
  onMenuToggle?: () => void
}

export function Navbar({ role, userName, onMenuToggle }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isLanding = pathname === '/'
  const { logout } = useAuth()
  const { unreadCount } = useNotifications()

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  const dashboardHref =
    role === 'student' ? '/student/dashboard'
    : role === 'institution' ? '/institution/dashboard'
    : role === 'admin' ? '/admin/portal'
    : '/'

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border',
        isLanding ? 'bg-background/80 backdrop-blur-md' : 'bg-card'
      )}
    >
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        {role && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuToggle}>
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <Link href={dashboardHref} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Scale className="h-4 w-4 text-white" />
          </div>
          <span className="font-heading font-bold text-foreground hidden sm:block">CJP</span>
        </Link>

        {isLanding && (
          <nav className="hidden md:flex items-center gap-6 ml-6">
            {['How It Works', 'Precedents', 'Transparency', 'Institutions'].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {role ? (
            <>
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link href="/notifications">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center bg-secondary text-white border-0">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-secondary text-white text-xs font-bold">
                        {(userName ?? 'CJ').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{userName ?? 'User'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-white" asChild>
                <Link href="/register">File a Dispute</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
