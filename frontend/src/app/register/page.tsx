'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Scale, Mail, Lock, User, Building2, ArrowRight, AlertCircle, Hash, BookOpen, Search, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/layout/Navbar'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { INSTITUTIONS } from '@/config/institutions'

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

  // Institution selector state
  const [institutionId, setInstitutionId] = useState('')
  const [selectedInstitutionName, setSelectedInstitutionName] = useState('')
  const [instSearch, setInstSearch] = useState('')
  const [showInstDropdown, setShowInstDropdown] = useState(false)

  const filteredInstitutions = useMemo(() => {
    if (!instSearch.trim()) return INSTITUTIONS
    const q = instSearch.toLowerCase()
    return INSTITUTIONS.filter(
      (i) => i.name.toLowerCase().includes(q) || i.region.toLowerCase().includes(q)
    )
  }, [instSearch])

  const groupedInstitutions = useMemo(() => {
    const groups: Record<string, typeof INSTITUTIONS> = {}
    for (const inst of filteredInstitutions) {
      if (!groups[inst.region]) groups[inst.region] = []
      groups[inst.region].push(inst)
    }
    return groups
  }, [filteredInstitutions])

  function selectInstitution(address: string, name: string) {
    setInstitutionId(address)
    setSelectedInstitutionName(name)
    setShowInstDropdown(false)
    setInstSearch('')
    // Auto-fill display name if empty
    if (!displayName) setDisplayName(name)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const glRole = role === 'student' ? 'STUDENT' : 'INSTITUTION'
      const extra =
        role === 'student'
          ? { matricNumber, department }
          : { domain, institutionId: institutionId || undefined }
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
              {/* Institution selector — shown first for institution role */}
              {role === 'institution' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Select Your Institution</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowInstDropdown(!showInstDropdown)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <span className={selectedInstitutionName ? 'text-foreground' : 'text-muted-foreground'}>
                        {selectedInstitutionName || 'Search and select your institution…'}
                      </span>
                      {selectedInstitutionName
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        : <svg className={`h-4 w-4 text-muted-foreground transition-transform ${showInstDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      }
                    </button>

                    {showInstDropdown && (
                      <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search institutions…"
                              value={instSearch}
                              onChange={(e) => setInstSearch(e.target.value)}
                              className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {Object.entries(groupedInstitutions).map(([region, insts]) => (
                            <div key={region}>
                              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">
                                {region}
                              </div>
                              {insts.map((inst) => (
                                <button
                                  key={inst.address}
                                  type="button"
                                  onClick={() => selectInstitution(inst.address, inst.name)}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary/10 transition-colors ${institutionId === inst.address ? 'bg-secondary/10 text-secondary font-medium' : 'text-foreground'}`}
                                >
                                  {inst.name}
                                </button>
                              ))}
                            </div>
                          ))}
                          {filteredInstitutions.length === 0 && (
                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                              No institutions match &quot;{instSearch}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This links your account to cases filed against your institution.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {role === 'student' ? 'Full Name' : 'Contact Person Name'}
                </label>
                <div className="relative">
                  {role === 'student'
                    ? <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    : <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  }
                  <Input
                    className="pl-9"
                    placeholder={role === 'student' ? 'John Doe' : 'e.g. Registrar / Dean of Students'}
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
                    placeholder={role === 'student' ? 'you@university.edu' : 'registrar@university.edu'}
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
