'use client'

import { Navbar } from '@/components/layout/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { StatsSection } from '@/components/landing/StatsSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { CTASection } from '@/components/landing/CTASection'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar role={null} />
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Campus Justice Protocol. Built on GenLayer.</p>
          <div className="flex items-center gap-4">
            <span>Transparency</span>
            <span>·</span>
            <span>Precedents</span>
            <span>·</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
