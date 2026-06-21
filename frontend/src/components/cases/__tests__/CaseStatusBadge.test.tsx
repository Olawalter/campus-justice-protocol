import React from 'react'
import { render, screen } from '@testing-library/react'
import { CaseStatusBadge } from '../CaseStatusBadge'

describe('CaseStatusBadge', () => {
  it('renders "Submitted" for SUBMITTED status', () => {
    render(<CaseStatusBadge status="SUBMITTED" />)
    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })

  it('renders "Verified" for VERIFIED status', () => {
    render(<CaseStatusBadge status="VERIFIED" />)
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('renders "Institution Notified" for INSTITUTION_NOTIFIED', () => {
    render(<CaseStatusBadge status="INSTITUTION_NOTIFIED" />)
    expect(screen.getByText('Institution Notified')).toBeInTheDocument()
  })

  it('renders "Responded" for RESPONDED', () => {
    render(<CaseStatusBadge status="RESPONDED" />)
    expect(screen.getByText('Responded')).toBeInTheDocument()
  })

  it('renders "Deliberating" for DELIBERATING', () => {
    render(<CaseStatusBadge status="DELIBERATING" />)
    expect(screen.getByText('Deliberating')).toBeInTheDocument()
  })

  it('renders "Judgment Issued" for JUDGMENT_ISSUED', () => {
    render(<CaseStatusBadge status="JUDGMENT_ISSUED" />)
    expect(screen.getByText('Judgment Issued')).toBeInTheDocument()
  })

  it('renders "Appealed" for APPEALED', () => {
    render(<CaseStatusBadge status="APPEALED" />)
    expect(screen.getByText('Appealed')).toBeInTheDocument()
  })

  it('renders "Final Judgment" for FINAL_JUDGMENT', () => {
    render(<CaseStatusBadge status="FINAL_JUDGMENT" />)
    expect(screen.getByText('Final Judgment')).toBeInTheDocument()
  })

  it('renders "Closed" for CLOSED', () => {
    render(<CaseStatusBadge status="CLOSED" />)
    expect(screen.getByText('Closed')).toBeInTheDocument()
  })

  it('accepts additional className', () => {
    const { container } = render(<CaseStatusBadge status="SUBMITTED" className="test-class" />)
    expect(container.firstChild).toHaveClass('test-class')
  })
})
