import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Send } from 'lucide-react'
import { useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Button } from '../../components/buttons/Button'
import { company, enquiryTypes } from '../../data/company'
import { ApiError } from '../../../shared/api'
import { submitEnquiry, validateEnquiry, type Delivery, type Enquiry, type EnquiryErrors } from '../../lib/enquiry'
import { EASE_OUT } from '../../lib/motion'

const initial: Enquiry = { name: '', email: '', phone: '', subject: enquiryTypes[0], message: '' }

interface FieldProps {
  name: keyof Enquiry
  label: string
  required?: boolean
  error?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
  filled: boolean
}

function Field({ name, label, required, error, children, filled }: FieldProps) {
  const uid = useId()
  const id = `${name}-${uid}`
  const errorId = `${id}-error`
  return (
    <div className={`field ${error ? 'has-error' : ''} ${filled ? 'is-filled' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required && (
          <span className="field__req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="field__control">
        {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? errorId : undefined })}
        <span className="field__line" aria-hidden="true" />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={errorId}
            className="field__error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Proposal request form with inline validation. */
export function ContactForm() {
  const [values, setValues] = useState<Enquiry>(initial)
  const [errors, setErrors] = useState<EnquiryErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof Enquiry, boolean>>>({})
  const [sent, setSent] = useState<Delivery | null>(null)
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const update = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const key = e.target.name as keyof Enquiry
    const next = { ...values, [key]: e.target.value }
    setValues(next)
    if (touched[key]) setErrors(validateEnquiry(next))
  }

  const blur = (key: keyof Enquiry) => {
    setTouched((t) => ({ ...t, [key]: true }))
    setErrors(validateEnquiry(values))
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = validateEnquiry(values)
    setErrors(found)
    setTouched({ name: true, email: true, phone: true, message: true })
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0]
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setSending(true)
    setSubmitError(null)
    try {
      const trap = e.currentTarget.elements.namedItem('website') as HTMLInputElement | null
      setSent(await submitEnquiry(values, trap?.value))
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields as EnquiryErrors)
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const shown = (key: keyof Enquiry) => (touched[key] ? errors[key] : undefined)

  return (
    <div className="contact-form">
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="sent"
            className="contact-form__sent"
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            <CheckCircle2 size={40} strokeWidth={1.25} aria-hidden="true" />
            {sent.via === 'api' ? (
              <>
                <h3 className="h3">Thank you — we’ve received your request</h3>
                <p className="muted">
                  {sent.reference && (
                    <>
                      Your reference is <strong>{sent.reference}</strong>.{' '}
                    </>
                  )}
                  Our operations manager will reply with a formal quote within 24 hours. For anything urgent, call{' '}
                  <a href={company.contact.phoneHref}>{company.contact.phone}</a>.
                </p>
              </>
            ) : (
              <>
                <h3 className="h3">Your request is ready to send</h3>
                <p className="muted">
                  Your email application has opened with the details pre-filled. If it didn’t open, write to us directly at{' '}
                  <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a> or call{' '}
                  <a href={company.contact.phoneHref}>{company.contact.phone}</a>.
                </p>
              </>
            )}
            <Button
              variant="ghost-dark"
              onClick={() => {
                setSent(null)
                setValues(initial)
                setTouched({})
                setErrors({})
              }}
            >
              New request
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-labelledby="form-title"
          >
            <div className="contact-form__head">
              <span className="eyebrow">Submit proposal request</span>
              <h2 id="form-title" className="h3">
                Tell us about your project
              </h2>
              <p className="muted">
                Submit your scope outline, project timelines, and details below. Our operations manager will reply with formal
                quotes within 24 hours.
              </p>
            </div>

            <div className="contact-form__grid">
              <Field name="name" label="Full name" required error={shown('name')} filled={!!values.name}>
                {(a11y) => (
                  <input {...a11y} name="name" type="text" autoComplete="name" value={values.name} onChange={update} onBlur={() => blur('name')} required />
                )}
              </Field>
              <Field name="email" label="Email address" required error={shown('email')} filled={!!values.email}>
                {(a11y) => (
                  <input {...a11y} name="email" type="email" autoComplete="email" value={values.email} onChange={update} onBlur={() => blur('email')} required />
                )}
              </Field>
              <Field name="phone" label="Phone number" error={shown('phone')} filled={!!values.phone}>
                {(a11y) => (
                  <input {...a11y} name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={update} onBlur={() => blur('phone')} />
                )}
              </Field>
              <Field name="subject" label="Subject" filled>
                {(a11y) => (
                  <select {...a11y} name="subject" value={values.subject} onChange={update}>
                    {enquiryTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                )}
              </Field>
              <div className="contact-form__full">
                <Field name="message" label="Message details" required error={shown('message')} filled={!!values.message}>
                  {(a11y) => (
                    <textarea {...a11y} name="message" rows={5} value={values.message} onChange={update} onBlur={() => blur('message')} required />
                  )}
                </Field>
              </div>
            </div>

            {/* Honeypot for spam bots: hidden from people and assistive technology. */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="contact-form__trap" />

            {submitError && (
              <p className="field__error contact-form__submit-error" role="alert">
                {submitError}
              </p>
            )}

            <div className="contact-form__foot">
              <p className="mono contact-form__note">
                <span aria-hidden="true">*</span> Required fields
              </p>
              <Button type="submit" variant="dark" icon={<Send size={16} strokeWidth={1.75} />} disabled={sending}>
                {sending ? 'Sending…' : 'Send proposal request'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
