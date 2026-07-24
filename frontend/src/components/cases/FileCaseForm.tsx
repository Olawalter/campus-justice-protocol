'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/contexts/WalletContext'
import { CASE_TYPE_META } from '@/lib/constants'

const CASE_TYPES = Object.entries(CASE_TYPE_META)

export function FileCaseForm() {
  const router = useRouter()
  const { connected, connect, fileCase, txPending } = useWallet()
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [filedCaseId, setFiledCaseId] = useState<string | null>(null)

  const [form, setForm] = useState({
    caseType: '',
    title: '',
    description: '',
    matricNumber: '',
    department: '',
    respondent: '',
    policyUrl: '',
  })

  function set(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!connected) { await connect(); return }
    if (!form.respondent.trim().startsWith('0x')) {
      setError('Respondent must be a valid wallet address starting with 0x')
      return
    }
    try {
      const caseId = await fileCase({
        caseType: form.caseType,
        title: form.title,
        description: form.description,
        matricNumber: form.matricNumber,
        department: form.department,
        respondent: form.respondent.trim(),
        policyUrl: form.policyUrl.trim(),
      })
      setFiledCaseId(caseId)
      setDone(true)
      setTimeout(() => router.push(`/cases/${caseId}`), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  if (done) {
    return (
      <div className="gl-card p-10 text-center space-y-4 gl-glow fade-up">
        <div className="text-5xl">⚖</div>
        <h2 className="text-xl font-bold gradient-text">Case Filed Successfully</h2>
        <p style={{ color: 'var(--color-muted)' }} className="text-sm">
          Case <span className="font-mono font-semibold">{filedCaseId}</span> is live on GenLayer.
          Both parties can now submit evidence on the case page.
        </p>
        <p style={{ color: 'var(--color-muted)' }} className="text-xs">Redirecting to case page…</p>
      </div>
    )
  }

  const steps = ['Case Type', 'Details', 'Parties & Policy']

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step + 1 && setStep(i)}
              className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: i === step ? 'var(--color-primary-light)' : i < step ? 'var(--color-muted)' : 'rgba(139,138,170,0.4)' }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: i === step ? 'var(--color-primary)' : i < step ? 'rgba(124,58,237,0.3)' : 'rgba(139,92,246,0.1)',
                  color: i <= step ? '#fff' : 'rgba(255,255,255,0.3)',
                }}
              >
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:block">{label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className="h-px w-8 sm:w-12" style={{ background: i < step ? 'var(--color-primary)' : 'rgba(109,40,217,0.2)' }} />
            )}
          </div>
        ))}
      </div>

      <div className="gl-card p-6">

        {/* Step 0: Case type */}
        {step === 0 && (
          <div className="space-y-4 fade-up">
            <h2 className="text-base font-semibold">What type of case are you filing?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CASE_TYPES.map(([type, meta]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { set('caseType', type); setStep(1) }}
                  className="text-left p-4 rounded-xl transition-all"
                  style={{
                    background: form.caseType === type ? 'rgba(124,58,237,0.15)' : 'rgba(139,92,246,0.04)',
                    border: `1px solid ${form.caseType === type ? 'rgba(139,92,246,0.5)' : 'rgba(109,40,217,0.15)'}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{meta.icon}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{meta.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{meta.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-4 fade-up">
            <h2 className="text-base font-semibold">Case Details</h2>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>Case Title *</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                placeholder="Brief, descriptive title"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>Description *</label>
              <textarea
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none transition-colors"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                rows={5}
                placeholder="Describe the issue in detail, including dates, parties involved, and what resolution you seek…"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>Matric Number</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  placeholder="e.g. 20/0001"
                  value={form.matricNumber}
                  onChange={e => set('matricNumber', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>Department</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  placeholder="e.g. Computer Science"
                  value={form.department}
                  onChange={e => set('department', e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(0)}
                className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--color-muted)' }}>
                Back
              </button>
              <button
                type="button"
                onClick={() => { if (form.title && form.description) setStep(2) }}
                disabled={!form.title || !form.description}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-primary)', color: '#fff', opacity: (!form.title || !form.description) ? 0.5 : 1 }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Parties + policy */}
        {step === 2 && (
          <div className="space-y-4 fade-up">
            <h2 className="text-base font-semibold">Respondent & Policy</h2>

            {/* Respondent address */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
                Institution Wallet Address *
              </label>
              <input
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                placeholder="0x… institution wallet address"
                value={form.respondent}
                onChange={e => set('respondent', e.target.value)}
                required
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                The institution must connect this wallet to submit their response and evidence. Only this address can act as respondent.
              </p>
            </div>

            {/* Policy URL */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
                Institution Policy URL <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <span style={{ fontSize: 14 }}>📋</span>
                <input
                  className="flex-1 bg-transparent text-sm outline-none font-mono"
                  style={{ color: 'var(--color-text)' }}
                  placeholder="https://university.edu/policies/academic-integrity"
                  value={form.policyUrl}
                  onChange={e => set('policyUrl', e.target.value)}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Each validator fetches the institution&apos;s policy live and cites specific clauses in the judgment.
              </p>
            </div>

            {/* Evidence note */}
            <div className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
              <span style={{ fontSize: 18, lineHeight: 1.4 }}>🌐</span>
              <div className="text-xs space-y-0.5">
                <p className="font-medium" style={{ color: '#4ade80' }}>Evidence is submitted on the case page</p>
                <p style={{ color: 'var(--color-muted)' }}>
                  After filing, both you and the institution can submit up to 5 evidence URLs each during the 3-day evidence window.
                  Each validator fetches those URLs live at judgment time.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl text-xs space-y-1"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <p className="font-medium" style={{ color: 'var(--color-primary-light)' }}>GenLayer Intelligent Contract</p>
              <p style={{ color: 'var(--color-muted)' }}>
                Validators independently fetch your evidence URLs, run AI analysis of both sides, and reach consensus via Optimistic Democracy. The judgment — including reasoning, key findings, and confidence score — is written permanently on-chain.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-xs"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--color-muted)' }}>
                Back
              </button>
              <button
                type="submit"
                disabled={txPending || !form.respondent.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: 'var(--color-primary)', color: '#fff', opacity: (txPending || !form.respondent.trim()) ? 0.7 : 1 }}
              >
                {txPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin" />
                    Submitting to GenLayer…
                  </>
                ) : connected ? 'File Case On-Chain' : 'Connect Wallet & File'}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
