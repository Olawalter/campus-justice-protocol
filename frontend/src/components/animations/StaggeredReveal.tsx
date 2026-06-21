'use client'

import { motion, type Variants } from 'framer-motion'

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

interface StaggeredRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function StaggeredReveal({ children, className, delay = 0 }: StaggeredRevealProps) {
  const containerWithDelay: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: delay,
      },
    },
  }

  return (
    <motion.div
      variants={containerWithDelay}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}
