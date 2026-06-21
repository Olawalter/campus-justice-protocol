'use client'

import { motion } from 'framer-motion'
import { FilePlus, Upload, Brain, Gavel } from 'lucide-react'

const steps = [
  {
    icon: FilePlus,
    step: '01',
    title: 'File Your Dispute',
    description:
      'Submit your case with supporting documents. Specify the institution, department, and nature of the dispute.',
    color: '#2563EB',
  },
  {
    icon: Upload,
    step: '02',
    title: 'Evidence Vault',
    description:
      'Upload PDFs, images, and documents. Each file is hashed on-chain — tamper-proof and permanently verifiable.',
    color: '#8B5CF6',
  },
  {
    icon: Brain,
    step: '03',
    title: 'AI Deliberation',
    description:
      'GenLayer validators independently analyze both sides using academic regulations and precedent cases.',
    color: '#F59E0B',
  },
  {
    icon: Gavel,
    step: '04',
    title: 'Judgment Issued',
    description:
      'A consensus judgment is recorded on-chain with full reasoning, confidence score, and evidence summary.',
    color: '#10B981',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-card border-t border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
            Four Steps to Justice
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            From filing to judgment, every step is transparent, on-chain, and AI-verified.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px bg-border hidden lg:block" />

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Icon */}
                <div
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg z-10"
                  style={{ backgroundColor: step.color + '15', border: `1.5px solid ${step.color}30` }}
                >
                  <step.icon className="h-8 w-8" style={{ color: step.color }} />
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.step}
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
