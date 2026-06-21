'use client'

import { useState } from 'react'
import { Shield, Copy, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'

interface EvidenceVaultProps {
  hashes: string[]
  label?: string
}

export function EvidenceVault({ hashes, label = 'Evidence Vault' }: EvidenceVaultProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  function copyHash(hash: string, idx: number) {
    try {
      navigator.clipboard.writeText(hash)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = hash
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  if (hashes.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {label}
          </h2>
        </div>
        <Badge variant="secondary" className="text-xs">
          {hashes.length} file{hashes.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        SHA-256 fingerprints anchored on GenLayer. Any file modification invalidates its hash.
      </p>

      <div className="space-y-2">
        {hashes.map((hash, i) => (
          <div
            key={hash}
            className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2.5 group"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-foreground/50 mr-1.5">File {i + 1}</span>
              <span className="text-xs font-mono text-muted-foreground break-all">{hash}</span>
            </div>
            <button
              onClick={() => copyHash(hash, i)}
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background shrink-0',
                copiedIdx === i && 'opacity-100'
              )}
              title="Copy hash"
            >
              {copiedIdx === i ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
        <Shield className="h-3 w-3" />
        <span>Immutably stored on GenLayer blockchain — tamper-proof</span>
      </div>
    </div>
  )
}
