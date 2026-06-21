'use client'

import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'

interface JusticeScaleProps {
  tilt?: 'left' | 'right' | 'balanced'
  size?: number
  className?: string
}

export function JusticeScale({ tilt = 'balanced', size = 120, className }: JusticeScaleProps) {
  const beamControls = useAnimation()
  const leftPanControls = useAnimation()
  const rightPanControls = useAnimation()

  const tiltAngle = tilt === 'left' ? -12 : tilt === 'right' ? 12 : 0
  const leftPanY = tilt === 'left' ? 8 : tilt === 'right' ? -8 : 0
  const rightPanY = tilt === 'right' ? 8 : tilt === 'left' ? -8 : 0

  useEffect(() => {
    const animate = async () => {
      await beamControls.start({
        rotate: tiltAngle,
        transition: { duration: 1.2, ease: [0.34, 1.56, 0.64, 1] },
      })
    }
    animate()
    leftPanControls.start({ y: leftPanY, transition: { duration: 1.2, ease: [0.34, 1.56, 0.64, 1] } })
    rightPanControls.start({ y: rightPanY, transition: { duration: 1.2, ease: [0.34, 1.56, 0.64, 1] } })
  }, [tilt, tiltAngle, leftPanY, rightPanY, beamControls, leftPanControls, rightPanControls])

  const s = size
  const cx = s / 2
  const beamW = s * 0.7
  const panW = s * 0.22
  const panH = s * 0.06
  const pillarH = s * 0.45
  const chainLen = s * 0.18

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base */}
      <rect x={cx - s * 0.12} y={s * 0.88} width={s * 0.24} height={s * 0.06} rx={s * 0.01} fill="currentColor" className="text-secondary" opacity={0.9} />
      {/* Pillar */}
      <rect x={cx - s * 0.015} y={s * 0.28} width={s * 0.03} height={pillarH} fill="currentColor" className="text-secondary" opacity={0.85} />
      {/* Top orb */}
      <circle cx={cx} cy={s * 0.27} r={s * 0.035} fill="currentColor" className="text-secondary" />

      {/* Beam */}
      <motion.g animate={beamControls} style={{ originX: `${cx}px`, originY: `${s * 0.27}px` }}>
        <rect
          x={cx - beamW / 2}
          y={s * 0.265}
          width={beamW}
          height={s * 0.015}
          rx={s * 0.008}
          fill="currentColor"
          className="text-foreground"
          opacity={0.8}
        />

        {/* Left pan assembly */}
        <motion.g animate={leftPanControls} style={{ originX: `${cx - beamW / 2}px` }}>
          {/* Chain */}
          <line
            x1={cx - beamW / 2}
            y1={s * 0.265}
            x2={cx - beamW / 2}
            y2={s * 0.265 + chainLen}
            stroke="currentColor"
            className="text-muted-foreground"
            strokeWidth={s * 0.008}
            strokeDasharray={`${s * 0.025} ${s * 0.012}`}
          />
          {/* Pan */}
          <ellipse
            cx={cx - beamW / 2}
            cy={s * 0.265 + chainLen + panH / 2}
            rx={panW / 2}
            ry={panH / 2}
            fill="currentColor"
            className="text-secondary"
            opacity={0.7}
          />
        </motion.g>

        {/* Right pan assembly */}
        <motion.g animate={rightPanControls} style={{ originX: `${cx + beamW / 2}px` }}>
          {/* Chain */}
          <line
            x1={cx + beamW / 2}
            y1={s * 0.265}
            x2={cx + beamW / 2}
            y2={s * 0.265 + chainLen}
            stroke="currentColor"
            className="text-muted-foreground"
            strokeWidth={s * 0.008}
            strokeDasharray={`${s * 0.025} ${s * 0.012}`}
          />
          {/* Pan */}
          <ellipse
            cx={cx + beamW / 2}
            cy={s * 0.265 + chainLen + panH / 2}
            rx={panW / 2}
            ry={panH / 2}
            fill="currentColor"
            className="text-secondary"
            opacity={0.7}
          />
        </motion.g>
      </motion.g>
    </svg>
  )
}
