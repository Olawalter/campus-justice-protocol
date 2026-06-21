'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Wallet, Copy, Check, Shield, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { cn } from '@/utils/cn'

function SettingsContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const role = user?.role === 'STUDENT' ? 'student' : user?.role === 'INSTITUTION' ? 'institution' : 'admin'

  function copyWallet() {
    if (!user?.walletAddress) return
    try {
      navigator.clipboard.writeText(user.walletAddress)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = user.walletAddress
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <PageWrapper role={role} userName={user?.displayName}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and embedded wallet.</p>
        </div>

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-5"
        >
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-secondary" />
            Profile
          </h2>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Display Name</label>
            <Input value={user?.displayName ?? ''} readOnly className="bg-muted/40" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              Email
            </label>
            <Input value={user?.email ?? ''} readOnly className="bg-muted/40" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Role</label>
            <Input value={user?.role ?? ''} readOnly className="bg-muted/40" />
          </div>

          {user?.matricNumber && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Matric Number</label>
              <Input value={user.matricNumber} readOnly className="bg-muted/40" />
            </div>
          )}
          {user?.department && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Department</label>
              <Input value={user.department} readOnly className="bg-muted/40" />
            </div>
          )}
        </motion.div>

        {/* Embedded Wallet */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-secondary" />
              Embedded Wallet
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
              Auto-provisioned
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Your wallet is automatically created and linked to your account. It is used to sign cases and interact with the GenLayer smart contract.
          </p>

          <div className="bg-muted/50 rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
                <p className="font-mono text-sm text-foreground break-all">
                  {user?.walletAddress ?? 'Generating…'}
                </p>
              </div>
              <button
                onClick={copyWallet}
                className={cn(
                  'shrink-0 p-2 rounded-lg border transition-all',
                  copied
                    ? 'border-green-500/40 bg-green-500/10 text-green-500'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-secondary/40'
                )}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-secondary" />
              Deterministically derived from your account — unique to you on GenLayer StudioNet
            </div>
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-card border border-destructive/20 rounded-2xl p-6 space-y-4"
        >
          <h2 className="font-heading font-semibold text-destructive">Sign Out</h2>
          <p className="text-sm text-muted-foreground">
            You will be redirected to the login page. Your wallet and cases are safely stored.
          </p>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </PageWrapper>
  )
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  )
}
