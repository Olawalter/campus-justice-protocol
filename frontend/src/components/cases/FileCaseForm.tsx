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

  const [form, setForm] = useState({
    caseType: '',
    title: '',
    description: '',
    evidenceRefs: '',
    matricNumber: '',
    department: '',
  })

  function set(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!connected) {
      await connect()
      return
    }
    try {
      await fileCase({
        caseType: form.caseType,
        title: form.title,
        description: form.description,
        evidenceRefs: form.evidenceRefs.split('\n').map(s => s.trim()).filter(Boolean),
        matricNumber: form.matricNumber,
        department: form.department,
      })
      setDone(true)
      setTimeout(() => router.push('/my-cases'), 3000)
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
          Your case has been submitted to the GenLayer network. Validators will deliberate and reach consensus.
        </p>
        <p style={{ color: 'var(--color-muted)' }} className="text-xs">Redirecting to My Cases…</p>
      </div>
    )
  }

  const steps = ['Case Type', 'Details', 'Evidence']

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
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'var(--color-primary)', color: '#fff', opacity: (!form.title || !form.description) ? 0.5 : 1 }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Evidence + submit */}
        {step === 2 && (
          <div className="space-y-4 fade-up">
            <h2 className="text-base font-semibold">Evidence References</h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Add links, document IDs, or IPFS hashes for supporting evidence. One per line.
            </p>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none font-mono"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              rows={4}
              placeholder={'https://drive.google.com/…\nipfs://Qm…\nDocID-1234'}
              value={form.evidenceRefs}
              onChange={e => set('evidenceRefs', e.target.value)}
            />

            <div
              className="p-4 rounded-xl text-xs space-y-1"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <p className="font-medium" style={{ color: 'var(--color-primary-light)' }}>GenLayer Intelligent Contract</p>
              <p style={{ color: 'var(--color-muted)' }}>
                Your case will be evaluated by multiple AI validators running independently. They must reach consensus
                (Optimistic Democracy) before a verdict is issued. This is immutable and transparent.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
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
                disabled={txPending}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{ background: 'var(--color-primary)', color: '#fff', opacity: txPending ? 0.7 : 1 }}
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
