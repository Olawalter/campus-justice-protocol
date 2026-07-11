'use client'

import { useEffect, useState } from 'react'
import { Case } from '@/lib/types'
import { readRecentCases } from '@/lib/genlayer'
import { CaseCard } from '@/components/cases/CaseCard'

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    readRecentCases(50)
      .then(setCases)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Cases</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          All disputes filed on-chain — evaluated by GenLayer validators
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-700 border-t-purple-300 rounded-full spin" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          Failed to load cases: {error}
        </div>
      )}

      {!loading && !error && cases.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">⚖</p>
          <p style={{ color: 'var(--color-muted)' }}>No cases filed yet. Be the first.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map(c => <CaseCard key={c.case_id} c={c} />)}
      </div>
    </div>
  )
}
