'use client'

import { motion } from 'framer-motion'
import { FileText, Shield, Hash, CheckCircle2 } from 'lucide-react'

const steps = [
  { icon: FileText, label: 'Document', color: '#2563EB' },
  { icon: Shield, label: 'Verification', color: '#F59E0B' },
  { icon: Hash, label: 'Hash Registered', color: '#8B5CF6' },
  { icon: CheckCircle2, label: 'Case Created', color: '#10B981' },
]

interface CaseSubmissionFlowProps {
  activeStep?: number
  className?: string
}

export function CaseSubmissionFlow({ activeStep = -1, className }: CaseSubmissionFlowProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* Step */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{
                scale: i <= activeStep ? 1 : 0.85,
                opacity: i <= activeStep ? 1 : 0.4,
              }}
              transition={{ duration: 0.4, delay: i * 0.12, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{
                  backgroundColor: i <= activeStep ? step.color + '20' : '#F1F5F9',
                  border: `1.5px solid ${i <= activeStep ? step.color : '#E2E8F0'}`,
                }}
              >
                <step.icon
                  className="h-4 w-4"
                  style={{ color: i <= activeStep ? step.color : '#94A3B8' }}
                />
              </div>
              <span
                className="text-[10px] font-medium text-center leading-tight max-w-[52px]"
                style={{ color: i <= activeStep ? step.color : '#94A3B8' }}
              >
                {step.label}
              </span>
            </motion.div>

            {/* Arrow connector */}
            {i < steps.length - 1 && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{
                  scaleX: i < activeStep ? 1 : 0.3,
                  opacity: i < activeStep ? 1 : 0.2,
                }}
                transition={{ duration: 0.3, delay: i * 0.12 + 0.2 }}
                className="h-px w-6 bg-border origin-left mb-4"
                style={{ backgroundColor: i < activeStep ? '#2563EB' : '#E2E8F0' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
