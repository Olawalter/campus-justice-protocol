export function ValidatorRing({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  const validators = 5
  const agreed = Math.round(confidence * validators)
  const circumference = 2 * Math.PI * 20
  const dash = (pct / 100) * circumference

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20" fill="none"
            stroke="var(--color-primary-light)" strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color: 'var(--color-primary-light)' }}>{pct}%</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Validator Consensus</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: validators }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: i < agreed ? 'var(--color-primary-light)' : 'rgba(139,92,246,0.2)',
                boxShadow: i < agreed ? '0 0 6px rgba(167,139,250,0.6)' : 'none',
              }}
            />
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {agreed}/{validators} validators agreed
        </p>
      </div>
    </div>
  )
}
