'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

function safeMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.'
  if (typeof error === 'string') return error
  if (error instanceof Error) {
    const msg = error.message
    if (typeof msg === 'string') return msg
    return String(msg)
  }
  if (typeof error === 'object' && error !== null) {
    if ('message' in error) {
      const m = (error as Record<string, unknown>).message
      return typeof m === 'string' ? m : JSON.stringify(m)
    }
    return JSON.stringify(error)
  }
  return String(error)
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const message = safeMessage(error)

  useEffect(() => {
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">{message}</p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">Error ID: {String(error.digest)}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go Home
          </Button>
          <Button onClick={reset} className="bg-secondary hover:bg-secondary/90 text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}
