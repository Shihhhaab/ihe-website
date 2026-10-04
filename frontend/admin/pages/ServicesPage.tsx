import { ClipboardList, ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ServiceRecord } from '../../../shared/types'
import { slugify } from '../../../shared/validation'
import { api, ApiError } from '../../shared/api'
import { previewUrl } from '../../shared/images'
import { ConfirmDialog, Dialog } from '../components/Modal'
import { RowMenu } from '../components/RowMenu'
import { useToast } from '../components/Toast'
import { Field, ImageInput, Toggle } from '../components/form'
import { EmptyState, ErrorNotice, PageHeader, SearchBox, StatGrid, TableFooter, TableSkeleton, VisibilityBadge } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { useForm } from '../hooks/useForm'
import { useQueryParam } from '../hooks/useQueryParam'
import { paginate, toNumberOrNull } from '../lib/format'
import './pages.css'

type Draft = {
  title: string
  slug: string
  short: string
  description: string
  bullets: string[]
  image: string | null
  imageAlt: string
  sortOrder: string
  visible: boolean
}

function ServiceEditor({ service, nextOrder, onClose, onSaved }: { service: ServiceRecord | null; nextOrder: number; onClose: () => void; onSaved: () => void }) {
  const [slugTouched, setSlugTouched] = useState(!!service)
  const { values, set, errors, submitting, submit } = useForm<Draft>({
    title: service?.title ?? '',
    slug: service?.slug ?? '',
    short: service?.short ?? '',
    description: service?.description ?? '',
    bullets: service?.bullets.length ? service.bullets : [''],
    image: service?.image || null,
    imageAlt: service?.imageAlt ?? '',
    sortOrder: String(service?.sortOrder ?? nextOrder),
    visible: service?.visible ?? true,
  })
  const notify = useToast()
  const updateBullet = (i: number, v: string) => set('bullets', values.bullets.map((b, j) => (j === i ? v : b)))

  return (
    <Dialog
      title={service ? 'Edit Service' : 'Add Service'}
      subtitle={service ? service.title : 'Add a service to the website'}
      onClose={onClose}
      onSubmit={async (e) => {
        e.preventDefault()
        const ok = await submit(async (v) => {
          const body = { ...v, image: v.image ?? '', sortOrder: toNumberOrNull(v.sortOrder) }
          await api(service ? `/admin/services/${service.id}` : '/admin/services', { method: service ? 'PUT' : 'POST', body })
        })
        if (ok) {
          notify(service ? 'Service updated' : 'Service added')
          onSaved()
        }
      }}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting && <span className="spinner" />}
            Save Service
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Service Name" required error={errors.title} className="span-2">
          {(a) => (
            <input
              {...a}
              className="input"
              value={values.title}
              placeholder="e.g. Road & Asphalt Works"
              onChange={(e) => {
                set('title', e.target.value)
                if (!slugTouched) set('slug', slugify(e.target.value))
              }}
            />
          )}
        </Field>
        <Field label="URL anchor" error={errors.slug} hint={`/services#${values.slug || 'service-name'}`}>
          {(a) => (
            <input
              {...a}
              className="input"
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', slugify(e.target.value))
              }}
            />
          )}
        </Field>
        <Field label="Display order" error={errors.sortOrder} hint="Lower numbers appear first.">
          {(a) => <input {...a} className="input" inputMode="numeric" value={values.sortOrder} onChange={(e) => set('sortOrder', e.target.value.replace(/\D/g, '').slice(0, 4))} />}
        </Field>
        <Field label="Summary" required error={errors.short} className="span-2" hint="One sentence, shown in the Home page services list.">
          {(a) => <textarea {...a} className="textarea" style={{ minHeight: 64 }} maxLength={240} value={values.short} onChange={(e) => set('short', e.target.value)} />}
        </Field>
        <Field label="Description" required error={errors.description} className="span-2" hint="Shown on the Services page.">
          {(a) => <textarea {...a} className="textarea" value={values.description} onChange={(e) => set('description', e.target.value)} />}
        </Field>

        <fieldset className="span-2" style={{ border: 0, padding: 0 }}>
          <legend className="field__label" style={{ marginBottom: 8 }}>
            Key points
          </legend>
          {values.bullets.map((b, i) => (
            <div className="spec-row" key={i}>
              <input className="input" aria-label={`Key point ${i + 1}`} placeholder="e.g. High-durability hot mix asphalt application." value={b} onChange={(e) => updateBullet(i, e.target.value)} />
              <button type="button" className="icon-btn" aria-label={`Remove key point ${i + 1}`} onClick={() => set('bullets', values.bullets.filter((_, j) => j !== i))}>
                <X />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => set('bullets', [...values.bullets, ''])} disabled={values.bullets.length >= 12}>
            <Plus /> Add Key Point
          </button>
          <p className="field__hint" style={{ marginTop: 6 }}>
            Listed with check marks under the service on the Services page.
          </p>
        </fieldset>

        <div className="span-2">
          <ImageInput folder="services" label="Service Image" value={values.image} onChange={(v) => set('image', v)} error={errors.image} />
        </div>
        <Field label="Image description (alt text)" error={errors.imageAlt} className="span-2" hint="Describe the photo for screen-reader users.">
          {(a) => <input {...a} className="input" value={values.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} />}
        </Field>
        <div className="span-2">
          <Toggle label="Show on website" description="Hidden services stay here but are removed from the Home and Services pages" checked={values.visible} onChange={(v) => set('visible', v)} />
        </div>
      </div>
    </Dialog>
  )
}

export default function ServicesPage() {
  const { data, error, loading, reload } = useApi<ServiceRecord[]>('/admin/services')
  const [query, setQuery] = useState('')
  const [visibility, setVisibility] = useState<'' | 'shown' | 'hidden'>('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<ServiceRecord | null>(null)
  // The open editor lives in the URL: ?edit=new creates, ?edit=12 edits (used by search and quick actions).
  const [editParam, setEditParam] = useQueryParam('edit')
  const editing: ServiceRecord | 'new' | null = editParam === 'new' ? 'new' : editParam ? (data?.find((x) => x.id === Number(editParam)) ?? null) : null
  const setEditing = (value: ServiceRecord | 'new' | null) => setEditParam(value === null ? null : value === 'new' ? 'new' : String(value.id))
  const notify = useToast()

  const all = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter(
      (s) =>
        (!visibility || (visibility === 'shown') === s.visible) &&
        (!q || [s.title, s.short, s.description].some((f) => f.toLowerCase().includes(q))),
    )
  }, [all, query, visibility])
  const { rows, pages, current, start } = paginate(filtered, page)
  const shown = all.filter((s) => s.visible)
  const nextOrder = (all.reduce((max, s) => Math.max(max, s.sortOrder), 0) || 0) + 10

  const setVisible = async (service: ServiceRecord, visible: boolean) => {
    try {
      await api(`/admin/services/${service.id}`, { method: 'PUT', body: { ...service, visible } })
      notify(visible ? 'Service shown on website' : 'Service hidden from website')
      reload()
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not update the service.', 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Services"
        description="Manage the services shown on the public website"
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
            <Plus /> Add Service
          </button>
        }
      />

      <StatGrid
        loading={loading}
        stats={[
          { label: 'Total Services', value: all.length, icon: ClipboardList, tone: 'navy' },
          { label: 'Shown on Website', value: shown.length, icon: Eye, tone: 'green' },
          { label: 'Hidden', value: all.length - shown.length, icon: EyeOff, tone: 'gold' },
        ]}
      />

      <section className="card" aria-label="Services">
        <div className="toolbar">
          <SearchBox label="Search services" placeholder="Search services…" value={query} onChange={(v) => (setQuery(v), setPage(1))} />
          <select className="select" aria-label="Filter by visibility" value={visibility} onChange={(e) => (setVisibility(e.target.value as '' | 'shown' | 'hidden'), setPage(1))}>
            <option value="">All Services</option>
            <option value="shown">Shown on Website</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        {error && (
          <div style={{ padding: '0 24px' }}>
            <ErrorNotice message={error.message} onRetry={reload} />
          </div>
        )}

        {loading ? (
          <TableSkeleton cols={5} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={all.length ? 'No services match your filters' : 'No services yet'}
            text={all.length ? 'Try a different search or filter.' : 'Add a service to show it on the website.'}
            action={
              !all.length && (
                <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
                  <Plus /> Add Service
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Service</th>
                  <th scope="col">Key Points</th>
                  <th scope="col">Order</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="col-action">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const thumb = previewUrl(s.image)
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="cell-media">
                          {thumb ? (
                            <img className="thumb" src={thumb} alt="" loading="lazy" />
                          ) : (
                            <span className="thumb thumb--empty">
                              <ClipboardList />
                            </span>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <button type="button" className="cell-title row-link" onClick={() => setEditing(s)}>
                              {s.title}
                            </button>
                            <span className="cell-sub">{s.short}</span>
                          </div>
                        </div>
                      </td>
                      <td className="nowrap">{s.bullets.length}</td>
                      <td className="strong">{s.sortOrder}</td>
                      <td>
                        <VisibilityBadge visible={s.visible} />
                      </td>
                      <td className="col-action">
                        <RowMenu
                          label={`Actions for ${s.title}`}
                          actions={[
                            { label: 'Edit', icon: Pencil, onSelect: () => setEditing(s) },
                            { label: 'View on website', icon: ExternalLink, onSelect: () => window.open(`/services#${s.slug}`, '_blank', 'noopener'), hidden: !s.visible },
                            { label: 'Show on website', icon: Eye, onSelect: () => setVisible(s, true), hidden: s.visible },
                            { label: 'Hide from website', icon: EyeOff, onSelect: () => setVisible(s, false), hidden: !s.visible },
                            { label: 'Delete', icon: Trash2, onSelect: () => setDeleting(s), danger: true },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <TableFooter total={filtered.length} page={current} pages={pages} start={start} onPage={setPage} />
      </section>

      {editing && (
        <ServiceEditor
          service={editing === 'new' ? null : editing}
          nextOrder={nextOrder}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete service?"
          message={`"${deleting.title}" will be permanently deleted and removed from the website.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/services/${deleting.id}`, { method: 'DELETE' })
              notify('Service deleted')
              reload()
            } catch (err) {
              notify(err instanceof ApiError ? err.message : 'Could not delete.', 'error')
            }
          }}
        />
      )}
    </>
  )
}
