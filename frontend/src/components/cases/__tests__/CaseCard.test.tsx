import React from 'react'
import { render, screen } from '@testing-library/react'
import { CaseCard } from '../CaseCard'

// next/link renders an <a> in tests — no need to mock
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

const BASE_PROPS = {
  caseId: 'CJP-000001',
  status: 'SUBMITTED' as const,
  disputeType: 'GPA_MISCALCULATION' as const,
  createdAt: 1705276800,
  href: '/student/cases/CJP-000001',
}

describe('CaseCard', () => {
  it('renders the case ID', () => {
    render(<CaseCard {...BASE_PROPS} />)
    expect(screen.getByText('CJP-000001')).toBeInTheDocument()
  })

  it('renders the formatted dispute type', () => {
    render(<CaseCard {...BASE_PROPS} />)
    expect(screen.getByText('GPA Miscalculation')).toBeInTheDocument()
  })

  it('renders the status badge', () => {
    render(<CaseCard {...BASE_PROPS} />)
    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<CaseCard {...BASE_PROPS} description="My GPA was incorrectly computed." />)
    expect(screen.getByText('My GPA was incorrectly computed.')).toBeInTheDocument()
  })

  it('does not render description when omitted', () => {
    render(<CaseCard {...BASE_PROPS} />)
    // The card has no description element when prop is absent
    expect(screen.queryByText(/My GPA/)).toBeNull()
    expect(screen.queryByText(/incorrectly/)).toBeNull()
  })

  it('renders institution name when provided', () => {
    render(<CaseCard {...BASE_PROPS} institutionName="Lagos University" />)
    expect(screen.getByText('Lagos University')).toBeInTheDocument()
  })

  it('renders a link pointing to href', () => {
    render(<CaseCard {...BASE_PROPS} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/student/cases/CJP-000001')
  })

  it('renders formatted date', () => {
    render(<CaseCard {...BASE_PROPS} />)
    // 1705276800 → 15 Jan 2024
    expect(screen.getByText(/Jan.*2024|2024.*Jan/)).toBeInTheDocument()
  })

  it('works with JUDGMENT_ISSUED status', () => {
    render(<CaseCard {...BASE_PROPS} status="JUDGMENT_ISSUED" />)
    expect(screen.getByText('Judgment Issued')).toBeInTheDocument()
  })
})
