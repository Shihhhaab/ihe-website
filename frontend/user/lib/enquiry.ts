import { validatePublicEnquiry } from '../../../shared/validation'
import { ApiError } from '../../shared/api'
import { company } from '../data/company'
import { sendEnquiry } from '../hooks/usePublicContent'

export interface Enquiry {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export type EnquiryErrors = Partial<Record<keyof Enquiry, string>>

/** Same rules the backend enforces (shared/validation.ts). */
export function validateEnquiry(values: Enquiry): EnquiryErrors {
  const result = validatePublicEnquiry(values)
  return result.ok ? {} : (result.errors as EnquiryErrors)
}

export type Delivery = { via: 'api'; reference: string | null } | { via: 'email' }

/**
 * Delivers an enquiry to the backend, where it appears in the admin panel's
 * Enquiries page. If the API can't be reached (e.g. the site is deployed
 * without the backend), it falls back to opening the visitor's email client
 * with a pre-filled message to the corporate inbox.
 *
 * Throws an ApiError for problems the visitor must act on (validation, rate limit).
 */
export async function submitEnquiry(values: Enquiry, honeypot = ''): Promise<Delivery> {
  try {
    const { reference } = await sendEnquiry({ ...values, website: honeypot })
    return { via: 'api', reference }
  } catch (err) {
    const unreachable = err instanceof ApiError && (err.status === 0 || err.status === 404 || err.status >= 500)
    if (!unreachable) throw err
  }

  const subject = `${values.subject} — ${values.name}`
  const lines = [`Name: ${values.name}`, `Email: ${values.email}`]
  if (values.phone.trim()) lines.push(`Phone: ${values.phone}`)
  lines.push(`Subject: ${values.subject}`, '', values.message)
  window.location.href = `mailto:${company.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
  return { via: 'email' }
}
