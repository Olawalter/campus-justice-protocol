import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-5xl font-mono font-bold gradient-text">404</p>
        <h1 className="text-xl font-semibold">Page Not Found</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>The page you are looking for does not exist.</p>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-xl text-sm font-medium mt-2"
          style={{ background: 'var(--color-primary)', color: '#fff' }}>
          Go Home
        </Link>
      </div>
    </div>
  )
}
