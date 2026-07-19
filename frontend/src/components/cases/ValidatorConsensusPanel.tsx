'use client'

import { useEffect, useState } from 'react'
import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

interface ConsensusData {
  votes: Record<string, string>
  result_name: string
  num_of_rounds: string | number
  last_leader: string
}

const VOTE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  agree:    { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)'  },
  disagree: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  idle:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)' },
  timeout:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)'  },
}

export function ValidatorConsensusPanel({
  caseId,
  isAppeal = false,
}: {
  caseId: string
  isAppeal?: boolean
}) {
  const [data, setData] = useState<ConsensusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = isAppeal ? `cjp_appeal_tx_${caseId}` : `cjp_judgment_tx_${caseId}`
    const txHash = localStorage.getItem(key)
    if (!txHash) { setLoading(false); return }

    const c = createClient({ chain: studionet })
    c.waitForTransactionReceipt({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hash: txHash as any,
      status: TransactionStatus.FINALIZED,
      retries: 5,
      interval: 3000,
    })
      .then((receipt: Record<string, unknown>) => {
        const cd = receipt.consensus_data as Record<string, unknown> | undefined
        const votes = cd?.votes as Record<string, string> | undefined
        if (votes) {
          setData({
            votes,
            result_name: (receipt.result_name as string) ?? '',
            num_of_rounds: (receipt.num_of_rounds as string | number) ?? 1,
            last_leader: (receipt.last_leader as string) ?? '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [caseId, isAppeal])

  if (loading || !data) return null

  const entries = Object.entries(data.votes)
  const agreed = entries.filter(([, v]) => v === 'agree').length
  const total = entries.length
  const pct = total > 0 ? Math.round((agreed / total) * 100) : 0

  return (
    <div className="gl-card p-6 space-y-5" style={{ border: '1px solid rgba(74,222,128,0.15)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: '#4ade80', fontSize: 16 }}>⬡</span>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>
            {isAppeal ? 'Appeal ' : ''}Validator Consensus
          </p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
        >
          {data.result_name.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Agreement', value: `${agreed}/${total} validators` },
          { label: 'Consensus', value: `${pct}%` },
          { label: 'Rounds', value: String(data.num_of_rounds) },
        ].map(s => (
          <div
            key={s.label}
            className="p-3 rounded-lg text-center"
            style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>{s.label}</p>
            <p className="text-sm font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Consensus bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
          <span>Agreement rate</span>
          <span style={{ color: '#4ade80' }}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.1)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #4ade80)' }}
          />
        </div>
      </div>

      {/* Individual validator votes */}
      <div>
        <p className="text-xs mb-2.5" style={{ color: 'var(--color-muted)' }}>
          Individual validator votes — Optimistic Democracy
        </p>
        <div className="space-y-2">
          {entries.map(([addr, vote]) => {
            const s = VOTE_STYLE[vote] ?? VOTE_STYLE.idle
            const isLeader = addr.toLowerCase() === data.last_leader.toLowerCase()
            return (
              <div
                key={addr}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-xs font-mono flex-1" style={{ color: s.color }}>
                  {addr.slice(0, 10)}…{addr.slice(-6)}
                </span>
                {isLeader && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
                    style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--color-primary-light)', border: '1px solid rgba(124,58,237,0.25)' }}
                  >
                    leader
                  </span>
                )}
                <span
                  className="text-xs font-medium shrink-0 capitalize"
                  style={{ color: s.color }}
                >
                  {vote}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs" style={{ color: 'rgba(139,92,246,0.5)' }}>
        Each validator ran the AI model independently — Optimistic Democracy resolved consensus
      </p>
    </div>
  )
}
