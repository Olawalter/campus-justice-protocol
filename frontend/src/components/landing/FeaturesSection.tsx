'use client'

import { motion } from 'framer-motion'
import { Scale, Shield, Brain, Library, BarChart3, Globe } from 'lucide-react'

const features = [
  {
    icon: Scale,
    title: 'Decentralized Court',
    description: 'GenLayer Intelligent Contracts serve as the judge. No single institution controls the outcome.',
    color: '#2563EB',
  },
  {
    icon: Brain,
    title: 'AI-Reasoned Verdicts',
    description: 'Every judgment includes full reasoning, evidence analysis, and a confidence score.',
    color: '#8B5CF6',
  },
  {
    icon: Shield,
    title: 'Evidence Integrity',
    description: 'Documents are SHA-256 hashed on-chain. Tampering is mathematically impossible.',
    color: '#10B981',
  },
  {
    icon: Library,
    title: 'Precedent Library',
    description: 'Resolved cases build a searchable body of academic precedent that improves future decisions.',
    color: '#F59E0B',
  },
  {
    icon: BarChart3,
    title: 'Institution Reputation',
    description: 'Transparency scores hold institutions accountable based on resolution speed and fairness.',
    color: '#EF4444',
  },
  {
    icon: Globe,
    title: 'Public Transparency',
    description: 'Aggregate statistics are publicly accessible. The system is auditable by anyone.',
    color: '#06B6D4',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3">
            Platform Features
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
            Built for Academic Justice
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: feature.color + '12' }}
              >
                <feature.icon className="h-6 w-6" style={{ color: feature.color }} />
              </div>
              <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
