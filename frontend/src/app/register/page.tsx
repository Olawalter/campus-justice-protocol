'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Scale, Mail, Lock, User, Building2, ArrowRight, AlertCircle, Hash, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/layout/Navbar'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'

type Role = 'student' | 'institution'

export default function RegisterPage() {
  const { register, loading, error } = useAuth()
  const router = useRouter()

  const [role, setRole] = useState<Role>('student')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [matricNumber, setMatricNumber] = useState('')
  const [department, setDepartment] = useState('')
  const [domain, setDomain] = useState('')
  const [institutionId, setInstitutionId] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const glRole = role === 'student' ? 'STUDENT' : 'INSTITUTION'
      const extra =
        role === 'student'
          ? { matricNumber, department }
          : { domain, institutionId: institutionId.trim() || undefined }
      const profile = await register(email, password, displayName, glRole, extra)
      const redirect =
        profile.role === 'STUDENT' ? '/student/dashboard'
        : profile.role === 'INSTITUTION' ? '/institution/dashboard'
        : '/admin/portal'
      router.push(redirect)
    } catch {
      // error shown via useAuth
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role={null} />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Create Account</h1>
            <p className="text-muted-foreground text-sm mt-1">Join the decentralized academic court</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
              {(['student', 'institution'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all',
                    role === r
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {r === 'student' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                  {r === 'student' ? 'Student' : 'Institution'}
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {role === 'student' ? 'Full Name' : 'Institution Name'}
                </label>
                <div className="relative">
                  {role === 'student'
                    ? <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    : <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  }
                  <Input
                    className="pl-9"
                    placeholder={role === 'student' ? 'John Doe' : 'University of Lagos'}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    type="email"
                    placeholder={role === 'student' ? 'you@university.edu' : 'admin@university.edu'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {role === 'student' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Matric Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="e.g. 190404001"
                        value={matricNumber}
                        onChange={(e) => setMatricNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Department</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="e.g. Computer Science"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {role === 'institution' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Institution Domain</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="university.edu"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Institution Address <span className="text-muted-foreground font-normal">(on-chain ID)</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 font-mono text-sm"
                        placeholder="0x0000000000000000000000000000000000000001"
                        value={institutionId}
                        onChange={(e) => setInstitutionId(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the blockchain address assigned to your institution by the CJP administrator. This links your account to cases filed against your institution.
                    </p>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary hover:bg-secondary/90 text-white gap-2 h-11"
              >
                {loading ? 'Creating account…' : 'Create Account'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-secondary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
