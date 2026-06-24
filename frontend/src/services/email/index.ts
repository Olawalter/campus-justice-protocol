import { SendEmailPayload } from '@/app/api/send-email/route'
import { EmailType } from './templates'

export async function sendCaseEmail(payload: Omit<SendEmailPayload, never>): Promise<void> {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Email is best-effort — never block the main flow
  }
}

export type { EmailType }
