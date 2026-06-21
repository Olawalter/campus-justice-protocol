'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

const stats = [
  { value: 2847, suffix: '+', label: 'Cases Filed', color: '#2563EB' },
  { value: 94, suffix: '%', label: 'Resolution Rate', color: '#10B981' },
  { value: 127, suffix: '', label: 'Institutions', color: '#8B5CF6' },
  { value: 48, suffix: 'h', label: 'Avg. Resolution', color: '#F59E0B' },
]

function CountUp({ value, suffix, color }: { value: number; suffix: string; color: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const display = useTransform(count, (v) => `${Math.round(v).toLocaleString()}${suffix}`)

  useEffect(() => {
    if (!inView) return
    const controls = animate(count, value, { duration: 1.5, ease: 'easeOut' })
    return controls.stop
  }, [inView, count, value])

  return (
    <motion.span ref={ref} className="text-5xl font-heading font-bold" style={{ color }}>
      {display}
    </motion.span>
  )
}

export function StatsSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center space-y-2"
            >
              <CountUp value={stat.value} suffix={stat.suffix} color={stat.color} />
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
