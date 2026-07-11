import Link from 'next/link'
import { CASE_TYPE_META } from '@/lib/constants'

const HOW_IT_WORKS = [
  { step: '01', title: 'File Your Case', desc: 'Submit your dispute with evidence references. All data is stored on the GenLayer blockchain.' },
  { step: '02', title: 'Respond (Optional)', desc: 'The respondent can submit their side of the story before deliberation begins.' },
  { step: '03', title: 'Validator Consensus', desc: 'Multiple AI validators independently evaluate the case using gl.eq_principle — Optimistic Democracy.' },
  { step: '04', title: 'Immutable Verdict', desc: 'A binding judgment with reasoning, confidence score, and full audit trail is recorded on-chain.' },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.2) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-2"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: 'var(--color-primary-light)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Powered by GenLayer Intelligent Contracts
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
            <span className="gradient-text">Campus Justice</span>
            <br />
            <span style={{ color: 'var(--color-text)' }}>Protocol</span>
          </h1>

          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--color-muted)' }}>
            A decentralized decision layer for universities. Every dispute is evaluated by AI validators reaching
            consensus through Optimistic Democracy — transparent, immutable, fair.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/file"
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto text-center"
              style={{ background: 'var(--color-primary)', color: '#fff', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}
            >
              File a Case
            </Link>
            <Link
              href="/cases"
              className="px-6 py-3 rounded-xl text-sm font-medium transition-all w-full sm:w-auto text-center"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              Browse Cases
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="gl-card p-5 space-y-3">
                <span className="font-mono text-2xl font-bold gradient-text">{step}</span>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case types */}
      <section className="py-16 px-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-3">Cases We Handle</h2>
          <p className="text-center text-sm mb-10" style={{ color: 'var(--color-muted)' }}>
            From academic disputes to hostel allocation — all evaluated on-chain
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(CASE_TYPE_META).map(([type, meta]) => (
              <Link
                key={type}
                href={`/file?type=${type}`}
                className="gl-card p-4 text-center space-y-2 transition-all hover:opacity-80"
                style={{ cursor: 'pointer' }}
              >
                <span className="text-3xl block">{meta.icon}</span>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{meta.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* GenLayer note */}
      <section className="py-12 px-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-2xl mx-auto gl-card p-6 gl-glow text-center space-y-3">
          <span className="text-3xl">⬡</span>
          <h3 className="text-base font-bold gradient-text">Built on GenLayer</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Every case evaluation uses <code className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--color-primary-light)' }}>gl.nondet.exec_prompt</code> for
            non-deterministic LLM analysis and <code className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--color-primary-light)' }}>gl.eq_principle.prompt_comparative</code> for
            validator consensus — ensuring fair, reproducible decisions.
          </p>
        </div>
      </section>
    </div>
  )
}
