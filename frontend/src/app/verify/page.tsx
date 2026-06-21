'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, ShieldX, Hash, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/layout/Navbar'
import { hashFile } from '@/utils/hash'
import { verifyEvidenceHash } from '@/services/genlayer/contract'

type VerifyResult = 'verified' | 'not_found' | null

export default function VerifyPage() {
  const [caseId, setCaseId] = useState('')
  const [hash, setHash] = useState('')
  const [result, setResult] = useState<VerifyResult>(null)
  const [checking, setChecking] = useState(false)
  const [hashing, setHashing] = useState(false)

  async function handleFileHash(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setHashing(true)
    const h = await hashFile(file)
    setHash(h)
    setHashing(false)
    e.target.value = ''
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    setResult(null)
    try {
      const found = await verifyEvidenceHash(caseId.trim(), hash.trim())
      setResult(found ? 'verified' : 'not_found')
    } catch {
      setResult('not_found')
    } finally {
      setChecking(false)
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
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-6 w-6 text-secondary" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Verify Evidence</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Check if a document is registered on-chain for a given case.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Case ID</label>
                <Input
                  placeholder="CJP-000001"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">SHA-256 Hash</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 font-mono text-xs"
                    placeholder="Paste hash or upload file below"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Or hash a file automatically</label>
                <label className="flex items-center gap-2 border border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-secondary/50 transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {hashing ? 'Hashing…' : 'Upload file to compute hash'}
                  </span>
                  <input type="file" className="hidden" onChange={handleFileHash} disabled={hashing} />
                </label>
              </div>

              <Button
                type="submit"
                disabled={checking}
                className="w-full bg-secondary hover:bg-secondary/90 text-white gap-2 h-11"
              >
                <Search className="h-4 w-4" />
                {checking ? 'Checking on-chain…' : 'Verify Evidence'}
              </Button>
            </form>

            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`rounded-xl border-2 p-4 text-center ${
                  result === 'verified'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
                    : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700'
                }`}
              >
                {result === 'verified' ? (
                  <>
                    <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">Evidence Verified</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                      This hash is registered on GenLayer for case {caseId}.
                    </p>
                  </>
                ) : (
                  <>
                    <ShieldX className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="font-semibold text-red-700 dark:text-red-400">Not Found</p>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                      This hash is not registered for case {caseId}.
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Verification queries GenLayer directly. Results are tamper-proof.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
