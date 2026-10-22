import { AlertCircle, ExternalLink, Info } from 'lucide-react'
import { useState } from 'react'
import { defaultHero } from '../../../shared/content/hero'
import type { HeroContent } from '../../../shared/types'
import { HERO_TITLE_LINE_MAX, HERO_TITLE_MAX_LINES, validateHero } from '../../../shared/validation'
import { api } from '../../shared/api'
import { ConfirmDialog } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Field, ImageInput } from '../components/form'
import { ErrorNotice, PageHeader } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { useForm } from '../hooks/useForm'
import './pages.css'

/** Form state: the heading is edited as one line per row. */
type Draft = Omit<HeroContent, 'title'> & { title: string }

const toDraft = (hero: HeroContent | null): Draft =>
  hero
    ? { ...hero, title: hero.title.join('\n') }
    : { image: null, imageAlt: '', subtitle: '', title: '', description: '', ctaLabel: '', ctaLink: '' }

const toBody = (d: Draft) => ({ ...d, title: d.title.split('\n') })

export default function HeaderPage() {
  // `null` = no header saved yet; the website shows its default header.
  const { data, error, loading, reload, setData } = useApi<HeroContent | null>('/admin/header')

  return (
    <>
      <PageHeader
        title="Website Header"
        description="Manage the image and text shown in the header at the top of the website's home page"
        actions={
          <a className="btn btn--secondary" href="/" target="_blank" rel="noopener">
            <ExternalLink /> View Website
          </a>
        }
      />
      {error ? (
        <ErrorNotice message={error.message} onRetry={reload} />
      ) : loading || data === undefined ? (
        <div className="skeleton settings-card" style={{ height: 520 }} aria-busy="true" aria-label="Loading" />
      ) : (
        <HeaderForm key={JSON.stringify(data)} saved={data} onSaved={setData} />
      )}
    </>
  )
}

function HeaderForm({ saved, onSaved }: { saved: HeroContent | null; onSaved: (hero: HeroContent) => void }) {
  const initial = toDraft(saved)
  const { values, set, setValues, errors, setErrors, submitting, submit } = useForm<Draft>(initial)
  const [failed, setFailed] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const notify = useToast()
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)

  return (
    <form
      noValidate
      className="settings-card"
      style={{ display: 'grid', gap: 24 }}
      onSubmit={async (e) => {
        e.preventDefault()
        // Same rules as the server, so mistakes show before anything is sent.
        const check = validateHero(toBody(values))
        if (!check.ok) {
          setErrors(check.errors)
          notify('Please correct the highlighted fields.', 'error')
          return
        }
        const result: { saved?: HeroContent } = {}
        const ok = await submit(async (v) => {
          result.saved = await api<HeroContent>('/admin/header', { method: 'PUT', body: toBody(v) })
        })
        setFailed(!ok)
        if (ok && result.saved) {
          notify('Website header saved. It appears on the website within a minute.')
          onSaved(result.saved)
        }
      }}
    >
      {!saved && (
        <div className="alert alert--info">
          <Info />
          <div>
            No header has been saved yet, so the website shows its default header. Fill in the form below, or{' '}
            <button type="button" className="link-btn" onClick={() => setValues(toDraft(defaultHero))}>
              start from the current website header
            </button>
            .
          </div>
        </div>
      )}
      {failed && (
        <div className="alert alert--error" role="alert">
          <AlertCircle /> Your changes were not saved. The website still shows the previously published header.
        </div>
      )}

      <section className="card" aria-labelledby="header-image">
        <div className="card__head">
          <div>
            <h2 id="header-image">Header Image</h2>
            <p>The photograph behind the header text</p>
          </div>
        </div>
        <div className="card__body form-grid">
          <div className="span-2">
            <ImageInput
              folder="hero"
              label="Header Image"
              value={values.image}
              // Removing a published image is confirmed first; nothing changes on the website until saved.
              onChange={(v) => (v === null && saved?.image ? setConfirmRemove(true) : set('image', v))}
              hint="Landscape photo, at least 1920×1080px. PNG, JPG or WebP, up to 4 MB."
              error={errors.image}
            />
            {!values.image && <p className="field__hint" style={{ marginTop: 8 }}>No image selected — the website will show its default header photograph.</p>}
          </div>
          {values.image && (
            <Field label="Image description (alt text)" required error={errors.imageAlt} className="span-2" hint="Describes the photo for visitors using screen readers.">
              {(a) => <input {...a} className="input" value={values.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} />}
            </Field>
          )}
        </div>
      </section>

      <section className="card" aria-labelledby="header-text">
        <div className="card__head">
          <div>
            <h2 id="header-text">Header Text</h2>
            <p>The heading, supporting text and main button</p>
          </div>
        </div>
        <div className="card__body">
          <div className="form-grid">
            <Field label="Subtitle" required error={errors.subtitle} className="span-2" hint="The short line above the heading.">
              {(a) => <input {...a} className="input" value={values.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="e.g. Roads · Infrastructure · Earthworks" />}
            </Field>
            <Field
              label="Main Heading"
              required
              error={errors.title}
              className="span-2"
              hint={`One line per row, up to ${HERO_TITLE_MAX_LINES} lines of ${HERO_TITLE_LINE_MAX} characters. The last line is shown in the accent colour.`}            >
              {(a) => <textarea {...a} className="textarea" rows={3} style={{ minHeight: 96 }} value={values.title} onChange={(e) => set('title', e.target.value)} />}
            </Field>
            <Field label="Description" required error={errors.description} className="span-2">
              {(a) => <textarea {...a} className="textarea" style={{ minHeight: 96 }} value={values.description} onChange={(e) => set('description', e.target.value)} />}
            </Field>
            <Field label="Primary Button Text" required error={errors.ctaLabel} hint="Shown on every header slide.">
              {(a) => <input {...a} className="input" value={values.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} placeholder="e.g. Explore our services" />}
            </Field>
            <Field label="Primary Button Link" required error={errors.ctaLink} hint="A page such as /services, or a full https:// address.">
              {(a) => <input {...a} className="input" value={values.ctaLink} onChange={(e) => set('ctaLink', e.target.value.trim())} placeholder="/services" />}
            </Field>
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setValues(initial)
                setErrors({})
                setFailed(false)
              }}
              disabled={submitting || !dirty}
            >
              Discard Changes
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting && <span className="spinner" />}
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </section>

      {confirmRemove && (
        <ConfirmDialog
          title="Remove header image?"
          message="Once you save, the website will show its default header photograph instead. Until then, the current image stays published."
          confirmLabel="Remove"
          onClose={() => setConfirmRemove(false)}
          onConfirm={() => set('image', null)}
        />
      )}
    </form>
  )
}
