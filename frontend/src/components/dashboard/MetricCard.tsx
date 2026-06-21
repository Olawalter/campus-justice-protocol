'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number
  suffix?: string
  prefix?: string
  icon: LucideIcon
  iconColor?: string
  trend?: { value: number; label: string }
  delay?: number
  className?: string
}

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`)

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' })
    return controls.stop
  }, [count, value])

  return <motion.span>{rounded}</motion.span>
}

export function MetricCard({
  label,
  value,
  suffix = '',
  prefix = '',
  icon: Icon,
  iconColor = '#2563EB',
  trend,
  delay = 0,
  className,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className={cn('border border-border bg-card hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {label}
              </p>
              <p className="text-3xl font-heading font-bold text-foreground">
                <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
              </p>
              {trend && (
                <p className={cn(
                  'text-xs mt-1.5 font-medium',
                  trend.value >= 0 ? 'text-emerald-600' : 'text-rose-500'
                )}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
                </p>
              )}
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: iconColor + '15' }}
            >
              <Icon className="h-5 w-5" style={{ color: iconColor }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
