const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://campusjp.vercel.app'

const brand = {
  primary: '#7C3AED',
  bg: '#0F0F13',
  card: '#1A1A24',
  border: '#2D2D3D',
  text: '#E5E5F0',
  muted: '#8B8BA7',
}

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Campus Justice Protocol</title>
</head>
<body style="margin:0;padding:0;background:${brand.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${brand.bg};padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
        <!-- Header -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <div style="width:32px;height:32px;background:${brand.primary};border-radius:8px;display:inline-block;vertical-align:middle;text-align:center;line-height:32px;">
              <span style="color:#fff;font-size:16px;">⚖</span>
            </div>
            <span style="color:${brand.text};font-size:16px;font-weight:700;vertical-align:middle;">Campus Justice Protocol</span>
          </div>
        </td></tr>
        <!-- Card -->
        <tr><td style="background:${brand.card};border:1px solid ${brand.border};border-radius:16px;padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top:20px;text-align:center;">
          <p style="color:${brand.muted};font-size:12px;margin:0;">
            This is an automated notification from Campus Justice Protocol.<br/>
            Decentralized academic dispute resolution powered by GenLayer.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function badge(text: string, color = brand.primary) {
  return `<span style="display:inline-block;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:600;letter-spacing:0.5px;">${text}</span>`
}

function caseInfoRow(label: string, value: string) {
  return `<tr>
    <td style="color:${brand.muted};font-size:13px;padding:6px 0;width:40%;">${label}</td>
    <td style="color:${brand.text};font-size:13px;padding:6px 0;font-weight:500;">${value}</td>
  </tr>`
}

function ctaButton(text: string, href: string) {
  return `<div style="text-align:center;margin-top:28px;">
    <a href="${href}" style="display:inline-block;background:${brand.primary};color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;">${text}</a>
  </div>`
}

function heading(text: string) {
  return `<h1 style="color:${brand.text};font-size:22px;font-weight:700;margin:0 0 8px;">${text}</h1>`
}

function subtext(text: string) {
  return `<p style="color:${brand.muted};font-size:14px;margin:0 0 24px;line-height:1.6;">${text}</p>`
}

function divider() {
  return `<hr style="border:none;border-top:1px solid ${brand.border};margin:24px 0;" />`
}

// ── Email templates ───────────────────────────────────────────────────────────

export type EmailType =
  | 'CASE_FILED_INSTITUTION'
  | 'CASE_FILED_STUDENT_CONFIRM'
  | 'CASE_VERIFIED'
  | 'INSTITUTION_NOTIFIED'
  | 'RESPONSE_SUBMITTED'
  | 'JUDGMENT_ISSUED'
  | 'APPEAL_FILED'
  | 'FINAL_JUDGMENT'

interface CaseEmailData {
  caseId: string
  institutionName: string
  disputeType: string
  description?: string
  studentName?: string
  studentEmail?: string
  status?: string
  outcome?: string
  responseText?: string
}

function formatType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function buildEmail(type: EmailType, data: CaseEmailData): { subject: string; html: string } {
  const institutionCaseUrl = `${BASE_URL}/institution/cases/${data.caseId}`
  const studentCaseUrl = `${BASE_URL}/student/cases/${data.caseId}`
  const adminCaseUrl = `${BASE_URL}/admin/cases/${data.caseId}`

  switch (type) {
    case 'CASE_FILED_INSTITUTION': {
      const html = layout(`
        ${badge('New Dispute Filed')}
        <div style="margin-top:16px;">
          ${heading('A student has filed a dispute against your institution')}
          ${subtext('Review the complaint and prepare your institutional response. You have been notified to respond within the stipulated timeframe.')}
        </div>
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${caseInfoRow('Case ID', data.caseId)}
          ${caseInfoRow('Institution', data.institutionName)}
          ${caseInfoRow('Dispute Type', formatType(data.disputeType))}
          ${data.studentName ? caseInfoRow('Filed by', data.studentName) : ''}
        </table>
        ${data.description ? `
        ${divider()}
        <p style="color:${brand.muted};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Student Complaint</p>
        <p style="color:${brand.text};font-size:14px;line-height:1.7;margin:0;background:${brand.bg};border:1px solid ${brand.border};border-radius:8px;padding:14px;">${data.description.slice(0, 500)}${data.description.length > 500 ? '…' : ''}</p>
        ` : ''}
        ${ctaButton('View Case & Respond →', institutionCaseUrl)}
      `)
      return { subject: `[CJP] New Dispute Filed — ${data.caseId} | ${formatType(data.disputeType)}`, html }
    }

    case 'CASE_FILED_STUDENT_CONFIRM': {
      const html = layout(`
        ${badge('Case Submitted', '#059669')}
        <div style="margin-top:16px;">
          ${heading('Your dispute has been filed successfully')}
          ${subtext('Your case is now recorded on the GenLayer blockchain. An admin will review and verify your case shortly.')}
        </div>
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${caseInfoRow('Case ID', data.caseId)}
          ${caseInfoRow('Institution', data.institutionName)}
          ${caseInfoRow('Dispute Type', formatType(data.disputeType))}
          ${caseInfoRow('Status', 'Submitted — Awaiting Verification')}
        </table>
        ${ctaButton('Track Your Case →', studentCaseUrl)}
      `)
      return { subject: `[CJP] Case Submitted — ${data.caseId}`, html }
    }

    case 'CASE_VERIFIED': {
      const html = layout(`
        ${badge('Case Verified', '#059669')}
        <div style="margin-top:16px;">
          ${heading('Your case has been verified')}
          ${subtext('An admin has reviewed and verified your dispute. It will now be forwarded to the institution for their response.')}
        </div>
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${caseInfoRow('Case ID', data.caseId)}
          ${caseInfoRow('Institution', data.institutionName)}
          ${caseInfoRow('Next Step', 'Institution will be notified to respond')}
        </table>
        ${ctaButton('View Case Progress →', studentCaseUrl)}
      `)
      return { subject: `[CJP] Case Verified — ${data.caseId}`, html }
    }

    case 'INSTITUTION_NOTIFIED': {
      const html = layout(`
        ${badge('Action Required', '#D97706')}
        <div style="margin-top:16px;">
          ${heading('Your institution must respond to a dispute')}
          ${subtext('A verified dispute has been officially forwarded to your institution. Please log in to your institutional portal, review the complaint, and submit your formal response.')}
        </div>
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${caseInfoRow('Case ID', data.caseId)}
          ${caseInfoRow('Dispute Type', formatType(data.disputeType))}
          ${data.studentName ? caseInfoRow('Filed by', data.studentName) : ''}
        </table>
        ${data.description ? `
        ${divider()}
        <p style="color:${brand.muted};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Student Complaint</p>
        <p style="color:${brand.text};font-size:14px;line-height:1.7;margin:0;background:${brand.bg};border:1px solid ${brand.border};border-radius:8px;padding:14px;">${data.description.slice(0, 600)}${data.description.length > 600 ? '…' : ''}</p>
        ` : ''}
        ${ctaButton('Log In & Submit Response →', institutionCaseUrl)}
      `)
      return { subject: `[CJP] Response Required — ${data.caseId} | ${formatType(data.disputeType)}`, html }
    }

    case 'RESPONSE_SUBMITTED': {
      const html = layout(`
        ${badge('Response Received')}
        <div style="margin-top:16px;">
          ${heading('The institution has submitted their response')}
          ${subtext('The institution has provided their formal response to your complaint. The case will now proceed to AI-powered deliberation by the GenLayer validator network.')}
        </div>
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${caseInfoRow('Case ID', data.caseId)}
          ${caseInfoRow('Institution', data.institutionName)}
          ${caseInfoRow('Next Step', 'AI deliberation by GenLayer validators')}
        </table>
        ${data.responseText ? `
        ${divider()}
        <p style="color:${brand.muted};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Institution Response (excerpt)</p>
        <p style="color:${brand.text};font-size:14px;line-height:1.7;margin:0;background:${brand.bg};border:1px solid ${brand.border};border-radius:8px;padding:14px;">${data.responseText.slice(0, 400)}${data.responseText.length > 400 ? '…' : ''}</p>
        ` : ''}
        ${ctaButton('View Full Response →', studentCaseUrl)}
      `)
      return { subject: `[CJP] Institution Responded — ${data.caseId}`, html }
    }

    case 'JUDGMENT_ISSUED': {
      const outcomeColor = data.outcome === 'UPHELD' ? '#059669' : data.outcome === 'REJECTED' ? '#DC2626' : '#D97706'
      const html = layout(`
        ${badge('Judgment Issued', outcomeColor)}
        <div style="margin-top:16px;">
          ${heading('The AI arbitration panel has reached a verdict')}
          ${subtext('The GenLayer validator network has deliberated on all evidence and issued a consensus judgment for your case.')}
        </div>
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${caseInfoRow('Case ID', data.caseId)}
          ${caseInfoRow('Institution', data.institutionName)}
          ${data.outcome ? caseInfoRow('Verdict', `<strong style="color:${outcomeColor};">${formatType(data.outcome)}</strong>`) : ''}
        </table>
        ${ctaButton('View Full Judgment →', studentCaseUrl)}
      `)
      return { subject: `[CJP] Judgment Issued — ${data.caseId} | ${data.outcome ? formatType(data.outcome) : 'Verdict Ready'}`, html }
    }

    case 'APPEAL_FILED': {
      const html = layout(`
        ${badge('Appeal Filed', '#D97706')}
        <div style="margin-top:16px;">
          ${heading('An appeal has been filed for this case')}
          ${subtext('One of the parties has filed an appeal. The case will undergo a second round of AI deliberation by the GenLayer appeal panel.')}
        </div>
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${caseInfoRow('Case ID', data.caseId)}
          ${caseInfoRow('Status', 'Appeal Under Review')}
        </table>
        ${ctaButton('View Appeal Details →', studentCaseUrl)}
      `)
      return { subject: `[CJP] Appeal Filed — ${data.caseId}`, html }
    }

    case 'FINAL_JUDGMENT': {
      const outcomeColor = data.outcome === 'UPHELD' ? '#059669' : data.outcome === 'REJECTED' ? '#DC2626' : '#D97706'
      const html = layout(`
        ${badge('Final Judgment', outcomeColor)}
        <div style="margin-top:16px;">
          ${heading('Final appeal judgment has been issued')}
          ${subtext('The appeal panel has issued a final, binding verdict. This decision cannot be further appealed.')}
        </div>
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${caseInfoRow('Case ID', data.caseId)}
          ${caseInfoRow('Institution', data.institutionName)}
          ${data.outcome ? caseInfoRow('Final Verdict', `<strong style="color:${outcomeColor};">${formatType(data.outcome)}</strong>`) : ''}
        </table>
        ${ctaButton('View Final Judgment →', studentCaseUrl)}
      `)
      return { subject: `[CJP] Final Judgment — ${data.caseId} | ${data.outcome ? formatType(data.outcome) : 'Final Verdict'}`, html }
    }

    default:
      return { subject: `[CJP] Case Update — ${data.caseId}`, html: layout(heading('Case Update')) }
  }
}
