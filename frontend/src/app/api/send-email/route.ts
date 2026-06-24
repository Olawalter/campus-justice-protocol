import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { buildEmail, EmailType } from '@/services/email/templates'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.EMAIL_FROM || 'Campus Justice Protocol <notifications@campusjp.vercel.app>'

export interface SendEmailPayload {
  to: string | string[]
  type: EmailType
  caseId: string
  institutionName: string
  disputeType: string
  description?: string
  studentName?: string
  studentEmail?: string
  outcome?: string
  responseText?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SendEmailPayload

    if (!body.to || !body.type || !body.caseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If no API key configured, silently succeed — email is optional
    if (!resend) {
      console.warn('[send-email] RESEND_API_KEY not set — skipping email')
      return NextResponse.json({ ok: true, skipped: true })
    }

    const { subject, html } = buildEmail(body.type, {
      caseId: body.caseId,
      institutionName: body.institutionName,
      disputeType: body.disputeType,
      description: body.description,
      studentName: body.studentName,
      studentEmail: body.studentEmail,
      outcome: body.outcome,
      responseText: body.responseText,
    })

    const recipients = Array.isArray(body.to) ? body.to : [body.to]
    const validRecipients = recipients.filter((e) => e && e.includes('@'))

    if (validRecipients.length === 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'no valid recipients' })
    }

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: validRecipients,
      subject,
      html,
    })

    if (error) {
      console.error('[send-email] Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (err) {
    console.error('[send-email] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
