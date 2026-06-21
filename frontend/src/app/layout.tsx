import type { Metadata } from 'next'
import { inter, plusJakarta, sourceSerif } from '@/lib/fonts'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://campusjp.vercel.app'

export const metadata: Metadata = {
  title: {
    default: 'Campus Justice Protocol',
    template: '%s | Campus Justice Protocol',
  },
  description:
    'AI-powered academic dispute resolution platform built on GenLayer. Transparent, decentralized academic court.',
  keywords: ['academic disputes', 'GenLayer', 'decentralized', 'AI arbitration', 'blockchain', 'campus justice'],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    siteName: 'Campus Justice Protocol',
    title: 'Campus Justice Protocol — Academic Justice, Decentralized',
    description: 'Resolve academic disputes through transparent AI-assisted reasoning and blockchain consensus. No bias. No delays. Explainable outcomes.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Campus Justice Protocol',
    description: 'AI-powered academic dispute resolution on GenLayer.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakarta.variable} ${sourceSerif.variable}`}
    >
      <body className="antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
