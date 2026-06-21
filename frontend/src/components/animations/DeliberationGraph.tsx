'use client'

import { motion } from 'framer-motion'
import { User, Building2, Brain, Users, CheckCircle2 } from 'lucide-react'

const nodes = [
  { id: 'student', label: 'Student Evidence', icon: User, x: 15, y: 50, color: '#2563EB' },
  { id: 'university', label: 'University Evidence', icon: Building2, x: 85, y: 50, color: '#8B5CF6' },
  { id: 'ai', label: 'AI Analysis', icon: Brain, x: 50, y: 20, color: '#F59E0B' },
  { id: 'validators', label: 'Validators', icon: Users, x: 50, y: 80, color: '#10B981' },
  { id: 'consensus', label: 'Consensus', icon: CheckCircle2, x: 50, y: 50, color: '#0F172A' },
]

const edges = [
  { from: 'student', to: 'ai' },
  { from: 'university', to: 'ai' },
  { from: 'student', to: 'validators' },
  { from: 'university', to: 'validators' },
  { from: 'ai', to: 'consensus' },
  { from: 'validators', to: 'consensus' },
]

function getNodePos(id: string, w: number, h: number) {
  const n = nodes.find((n) => n.id === id)!
  return { x: (n.x / 100) * w, y: (n.y / 100) * h }
}

interface DeliberationGraphProps {
  activeNodes?: string[]
  className?: string
  width?: number
  height?: number
}

export function DeliberationGraph({
  activeNodes = [],
  className,
  width = 300,
  height = 200,
}: DeliberationGraphProps) {
  return (
    <div className={className}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = getNodePos(edge.from, width, height)
          const to = getNodePos(edge.to, width, height)
          const active = activeNodes.includes(edge.from) && activeNodes.includes(edge.to)
          return (
            <motion.line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={active ? '#2563EB' : '#E2E8F0'}
              strokeWidth={active ? 1.5 : 1}
              strokeDasharray="5 3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: active ? 0.8 : 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const x = (node.x / 100) * width
          const y = (node.y / 100) * height
          const active = activeNodes.includes(node.id)
          return (
            <motion.g key={node.id}>
              {/* Pulse ring for active */}
              {active && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r={24}
                  fill="none"
                  stroke={node.color}
                  strokeWidth={1}
                  opacity={0.3}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              {/* Node circle */}
              <motion.circle
                cx={x}
                cy={y}
                r={18}
                fill={active ? node.color : '#F8FAFC'}
                stroke={active ? node.color : '#E2E8F0'}
                strokeWidth={1.5}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
              />
              {/* Label */}
              <motion.text
                x={x}
                y={y + 30}
                textAnchor="middle"
                fontSize={9}
                fill={active ? node.color : '#94A3B8'}
                fontWeight={active ? '600' : '400'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                {node.label}
              </motion.text>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
