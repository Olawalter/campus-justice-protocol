'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-4xl">⚠</p>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{error.message}</p>
        <button onClick={reset} className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--color-primary)', color: '#fff' }}>
          Try Again
        </button>
      </div>
    </div>
  )
}
