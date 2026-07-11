import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/contexts/WalletContext'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Campus Justice Protocol',
  description: 'A decentralized decision layer for universities — powered by GenLayer intelligent contracts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <Header />
          <main>{children}</main>
        </WalletProvider>
      </body>
    </html>
  )
}
