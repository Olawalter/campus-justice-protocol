'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { cn } from '@/utils/cn'

interface PageWrapperProps {
  children: React.ReactNode
  role?: 'student' | 'institution' | 'admin'
  userName?: string
  className?: string
}

export function PageWrapper({ children, role, userName, className }: PageWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!role) {
    // Public layout (landing, auth pages)
    return (
      <div className="min-h-screen bg-background">
        <Navbar role={null} />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={className}
        >
          {children}
        </motion.main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        role={role}
        userName={userName}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          role={role}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={cn('flex-1 overflow-y-auto p-4 md:p-6 lg:p-8', className)}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
