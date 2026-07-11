'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@/contexts/WalletContext'
import { Case } from '@/lib/types'
import { readCasesByFiler } from '@/lib/genlayer'
import { CaseCard } from '@/components/cases/CaseCard'

export default function MyCasesPage() {
  const { address, connected, connect, connecting } = useWallet()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return
    setLoading(true)
    readCasesByFiler(address)
      .then(setCases)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [address])

  if (!connected) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
        <span className="text-5xl">🔗</span>
        <h1 className="text-xl font-bold">Connect Your Wallet</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Your cases are stored on-chain, linked to your wallet address.
        </p>
        <button
          onClick={connect}
          disabled={connecting}
          className="px-6 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--color-primary)', color: '#fff', opacity: connecting ? 0.7 : 1 }}
        >
          {connecting ? 'Connecting…' : 'Connect Wallet'}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">My Cases</h1>
          <p className="text-sm font-mono" style={{ color: 'var(--color-muted)' }}>
            {address?.slice(0, 8)}…{address?.slice(-6)}
          </p>
        </div>
        <Link
          href="/file"
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          + File Case
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-700 border-t-purple-300 rounded-full spin" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          {error}
        </div>
      )}

      {!loading && !error && cases.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">📄</p>
          <p style={{ color: 'var(--color-muted)' }}>You have not filed any cases yet.</p>
          <Link
            href="/file"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border)' }}
          >
            File Your First Case
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map(c => <CaseCard key={c.case_id} c={c} />)}
      </div>
    </div>
  )
}
