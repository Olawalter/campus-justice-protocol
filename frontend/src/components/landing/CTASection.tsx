'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="py-24 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Student CTA */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-secondary p-8 text-white"
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
            <GraduationCap className="h-10 w-10 mb-4 opacity-90" />
            <h3 className="text-2xl font-heading font-bold mb-2">For Students</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Facing a GPA error, missing grade, or unfair suspension?
              File your dispute and let the decentralized court evaluate your case.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-secondary hover:bg-white/90 gap-2"
              asChild
            >
              <Link href="/register?role=student">
                Start a Case
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Institution CTA */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-card border border-border p-8"
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-secondary/5 -translate-y-1/2 translate-x-1/4" />
            <Building2 className="h-10 w-10 mb-4 text-secondary" />
            <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
              For Institutions
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Join the transparency network. Respond to cases, build your reputation score,
              and demonstrate fair academic governance.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="border-secondary/40 text-secondary hover:border-secondary hover:bg-secondary/5 gap-2"
              asChild
            >
              <Link href="/register?role=institution">
                Register Institution
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
