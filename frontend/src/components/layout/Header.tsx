'use client'

import Link from 'next/link'
import { useWallet } from '@/contexts/WalletContext'
import { usePathname } from 'next/navigation'

export function Header() {
  const { address, connected, connecting, connect, disconnect } = useWallet()
  const path = usePathname()

  const nav = [
    { href: '/cases', label: 'Cases' },
    { href: '/file', label: 'File Case' },
    { href: '/my-cases', label: 'My Cases' },
  ]

  return (
    <header style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(8,8,15,0.9)' }}
      className="sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-sm">
          <span className="gradient-text text-base font-mono">CJP</span>
          <span style={{ color: 'var(--color-muted)' }} className="hidden sm:block">Campus Justice Protocol</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                color: path === href ? 'var(--color-primary-light)' : 'var(--color-muted)',
                background: path === href ? 'var(--color-primary-dim)' : 'transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {connected && address ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary-light)', border: '1px solid var(--color-border-bright)' }}>
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                {address.slice(0, 6)}…{address.slice(-4)}
              </div>
              <button
                onClick={disconnect}
                className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                style={{ color: 'var(--color-muted)' }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                opacity: connecting ? 0.7 : 1,
              }}
            >
              {connecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
