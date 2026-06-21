'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JusticeScale } from '@/components/animations/JusticeScale'
import { StaggeredReveal, RevealItem } from '@/components/animations/StaggeredReveal'
import { Badge } from '@/components/ui/badge'

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/3 w-64 h-64 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <StaggeredReveal>
            <RevealItem>
              <Badge
                variant="outline"
                className="mb-6 border-secondary/30 text-secondary bg-secondary/5 px-3 py-1 text-xs font-medium"
              >
                <Zap className="h-3 w-3 mr-1.5" />
                Powered by GenLayer Intelligent Contracts
              </Badge>
            </RevealItem>

            <RevealItem>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-foreground leading-[1.05] tracking-tight">
                Academic Justice,{' '}
                <span className="text-secondary">Decentralized</span>
              </h1>
            </RevealItem>

            <RevealItem>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Campus Justice Protocol resolves academic disputes through transparent
                AI-assisted reasoning and blockchain consensus. No bias. No delays.
                Explainable outcomes.
              </p>
            </RevealItem>

            <RevealItem>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 text-white h-12 px-6 gap-2 text-base"
                  asChild
                >
                  <Link href="/register">
                    File a Dispute
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 text-base border-border hover:border-secondary/50"
                  asChild
                >
                  <Link href="/transparency">View Transparency Dashboard</Link>
                </Button>
              </div>
            </RevealItem>

            <RevealItem>
              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                {[
                  { icon: Shield, text: 'Cryptographically verified' },
                  { icon: Zap, text: 'AI-reasoned outcomes' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-secondary" />
                    {text}
                  </div>
                ))}
              </div>
            </RevealItem>
          </StaggeredReveal>

          {/* Right: Animated scale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative">
              {/* Background card */}
              <div className="absolute inset-0 rounded-3xl bg-card border border-border shadow-2xl transform rotate-3" />
              <div className="relative rounded-3xl bg-card border border-border shadow-xl p-12 space-y-6">
                <div className="text-center">
                  <JusticeScale size={160} tilt="balanced" className="mx-auto text-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-heading font-bold text-foreground text-lg">Fair & Transparent</p>
                  <p className="text-sm text-muted-foreground">AI-powered deliberation</p>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                  {[
                    { value: '98%', label: 'Resolved' },
                    { value: '<72h', label: 'Avg. Time' },
                    { value: '5x', label: 'Validators' },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="font-heading font-bold text-secondary text-lg">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
