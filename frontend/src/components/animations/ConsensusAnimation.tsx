'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ConsensusAnimationProps {
  totalValidators?: number
  agreedValidators?: number
  achieved?: boolean
  className?: string
}

export function ConsensusAnimation({
  totalValidators = 5,
  agreedValidators = 0,
  achieved = false,
  className,
}: ConsensusAnimationProps) {
  const validators = Array.from({ length: totalValidators }, (_, i) => ({
    id: i,
    agreed: i < agreedValidators,
  }))

  // Position validators in a circle
  const radius = 60
  const cx = 80
  const cy = 80

  return (
    <div className={cn('relative', className)}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Connection lines */}
        {validators.map((v, i) => {
          const angle = (i / totalValidators) * 2 * Math.PI - Math.PI / 2
          const x = cx + radius * Math.cos(angle)
          const y = cy + radius * Math.sin(angle)
          return (
            <motion.line
              key={`line-${v.id}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={v.agreed ? '#2563EB' : '#E2E8F0'}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: v.agreed ? 0.6 : 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            />
          )
        })}

        {/* Center node */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={achieved ? 20 : 16}
          fill={achieved ? '#2563EB' : '#0F172A'}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        />
        {achieved && (
          <motion.circle
            cx={cx}
            cy={cy}
            r={28}
            fill="none"
            stroke="#2563EB"
            strokeWidth="1.5"
            opacity={0.3}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Validator nodes */}
        {validators.map((v, i) => {
          const angle = (i / totalValidators) * 2 * Math.PI - Math.PI / 2
          const x = cx + radius * Math.cos(angle)
          const y = cy + radius * Math.sin(angle)
          return (
            <motion.g key={`node-${v.id}`}>
              <motion.circle
                cx={x}
                cy={y}
                r={12}
                fill={v.agreed ? '#2563EB' : '#E2E8F0'}
                stroke={v.agreed ? '#2563EB' : '#94A3B8'}
                strokeWidth="1.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2 + i * 0.15,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              />
              {v.agreed && (
                <motion.path
                  d={`M${x - 5},${y} L${x - 2},${y + 4} L${x + 5},${y - 4}`}
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.15 }}
                />
              )}
            </motion.g>
          )
        })}
      </svg>

      {/* Consensus label */}
      {achieved && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="text-center mt-2"
        >
          <div className="flex items-center justify-center gap-1.5 text-secondary">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-semibold">Consensus Achieved</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {agreedValidators}/{totalValidators} validators
          </p>
        </motion.div>
      )}
    </div>
  )
}
