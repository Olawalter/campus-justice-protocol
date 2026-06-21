import {
  formatAddress,
  formatDate,
  formatCaseStatus,
  formatDisputeType,
  formatOutcome,
  formatConfidence,
} from '../format'

describe('formatAddress', () => {
  it('abbreviates a full Ethereum address', () => {
    expect(formatAddress('0xD9368922786222Ad59fA9C54769927C6DBddB109')).toBe('0xD936...B109')
  })

  it('returns empty string for empty input', () => {
    expect(formatAddress('')).toBe('')
  })
})

describe('formatDate', () => {
  it('formats a Unix timestamp in seconds', () => {
    // 2024-01-15 00:00:00 UTC
    const ts = 1705276800
    const result = formatDate(ts)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2024/)
  })
})

describe('formatCaseStatus', () => {
  it('formats SUBMITTED', () => {
    expect(formatCaseStatus('SUBMITTED')).toBe('Submitted')
  })

  it('formats INSTITUTION_NOTIFIED', () => {
    expect(formatCaseStatus('INSTITUTION_NOTIFIED')).toBe('Institution Notified')
  })

  it('formats FINAL_JUDGMENT', () => {
    expect(formatCaseStatus('FINAL_JUDGMENT')).toBe('Final Judgment')
  })

  it('formats DELIBERATING', () => {
    expect(formatCaseStatus('DELIBERATING')).toBe('Deliberating')
  })
})

describe('formatDisputeType', () => {
  it('formats GPA_MISCALCULATION', () => {
    expect(formatDisputeType('GPA_MISCALCULATION')).toBe('GPA Miscalculation')
  })

  it('formats WRONGFUL_SUSPENSION', () => {
    expect(formatDisputeType('WRONGFUL_SUSPENSION')).toBe('Wrongful Suspension')
  })

  it('formats THESIS_GRADING', () => {
    expect(formatDisputeType('THESIS_GRADING')).toBe('Thesis/Project Grading')
  })
})

describe('formatOutcome', () => {
  it('formats UPHELD', () => {
    expect(formatOutcome('UPHELD')).toBe('Appeal Upheld')
  })

  it('formats REJECTED', () => {
    expect(formatOutcome('REJECTED')).toBe('Appeal Rejected')
  })

  it('formats FURTHER_REVIEW', () => {
    expect(formatOutcome('FURTHER_REVIEW')).toBe('Further Review Required')
  })

  it('formats SETTLEMENT_RECOMMENDED', () => {
    expect(formatOutcome('SETTLEMENT_RECOMMENDED')).toBe('Settlement Recommended')
  })
})

describe('formatConfidence', () => {
  it('converts 0.84 to 84%', () => {
    expect(formatConfidence(0.84)).toBe('84%')
  })

  it('converts 1.0 to 100%', () => {
    expect(formatConfidence(1.0)).toBe('100%')
  })

  it('rounds correctly', () => {
    expect(formatConfidence(0.876)).toBe('88%')
  })
})
