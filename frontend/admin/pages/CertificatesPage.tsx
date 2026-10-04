import { Award, CalendarClock, ExternalLink, Eye, EyeOff, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CertificateRecord } from '../../../shared/types'
import { api, ApiError } from '../../shared/api'
import { fullUrl, previewUrl } from '../../shared/images'
import { ConfirmDialog, Dialog } from '../components/Modal'
import { RowMenu } from '../components/RowMenu'
import { useToast } from '../components/Toast'
import { Field, ImageInput, Toggle } from '../components/form'
import { Badge, EmptyState, ErrorNotice, PageHeader, SearchBox, StatGrid, TableFooter, TableSkeleton, VisibilityBadge } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { useForm } from '../hooks/useForm'
import { useQueryParam } from '../hooks/useQueryParam'
import { paginate, toNumberOrNull } from '../lib/format'
import './pages.css'

type Draft = {
  title: string
  issuer: string
  reference: string
  issueDate: string
  expiryDate: string
  description: string
  file: string | null
  sortOrder: string
  visible: boolean
}

const today = () => new Date().toISOString().slice(0, 10)
const in90Days = () => new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10)

/** Validity for a certificate's expiry date: expired, expiring within 90 days, or valid. */
function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return <span className="muted">—</span>
  if (expiryDate < today()) return <Badge tone="red">Expired</Badge>
  if (expiryDate <= in90Days()) return <Badge tone="amber">Expires soon</Badge>
  return <Badge tone="green">Valid</Badge>
}

function CertificateEditor({ certificate, nextOrder, onClose, onSaved }: { certificate: CertificateRecord | null; nextOrder: number; onClose: () => void; onSaved: () => void }) {
  const { values, set, errors, submitting, submit } = useForm<Draft>({
    title: certificate?.title ?? '',
    issuer: certificate?.issuer ?? '',
    reference: certificate?.reference ?? '',
    issueDate: certificate?.issueDate ?? '',
    expiryDate: certificate?.expiryDate ?? '',
    description: certificate?.description ?? '',
    file: certificate?.file ?? null,
    sortOrder: String(certificate?.sortOrder ?? nextOrder),
    visible: certificate?.visible ?? true,
  })
  const notify = useToast()

  return (
    <Dialog
      title={certificate ? 'Edit Certificate' : 'Add Certificate'}
      subtitle={certificate ? certificate.title : 'Certificates are shown on the website’s About page'}
      onClose={onClose}
      onSubmit={async (e) => {
        e.preventDefault()
        const ok = await submit(async (v) => {
          const body = { ...v, file: v.file ?? '', sortOrder: toNumberOrNull(v.sortOrder) }
          await api(certificate ? `/admin/certificates/${certificate.id}` : '/admin/certificates', { method: certificate ? 'PUT' : 'POST', body })
        })
        if (ok) {
          notify(certificate ? 'Certificate updated' : 'Certificate added')
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
            Save Certificate
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Certificate Name" required error={errors.title} className="span-2">
          {(a) => <input {...a} className="input" value={values.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. ISO 9001:2015 — Quality Management System" />}
        </Field>
        <Field label="Issuing Body" required error={errors.issuer}>
          {(a) => <input {...a} className="input" value={values.issuer} onChange={(e) => set('issuer', e.target.value)} placeholder="e.g. Certification body name" />}
        </Field>
        <Field label="Certificate Number" error={errors.reference}>
          {(a) => <input {...a} className="input" value={values.reference} onChange={(e) => set('reference', e.target.value)} />}
        </Field>
        <Field label="Issue Date" error={errors.issueDate}>
          {(a) => <input {...a} className="input" type="date" value={values.issueDate} onChange={(e) => set('issueDate', e.target.value)} />}
        </Field>
        <Field label="Expiry Date" error={errors.expiryDate}>
          {(a) => <input {...a} className="input" type="date" value={values.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />}
        </Field>
        <Field label="Description" error={errors.description} className="span-2" hint="Optional. A short note shown under the certificate.">
          {(a) => <textarea {...a} className="textarea" style={{ minHeight: 72 }} maxLength={500} value={values.description} onChange={(e) => set('description', e.target.value)} />}
        </Field>
        <div className="span-2">
          <ImageInput
            folder="certificates"
            label="Certificate File"
            value={values.file}
            onChange={(v) => set('file', v)}
            error={errors.file}
            library={false}
            hint="Image (PNG, JPG, WebP, up to 4 MB) or PDF (up to 8 MB)"
          />
        </div>
        <Field label="Display order" error={errors.sortOrder} hint="Lower numbers appear first.">
          {(a) => <input {...a} className="input" inputMode="numeric" value={values.sortOrder} onChange={(e) => set('sortOrder', e.target.value.replace(/\D/g, '').slice(0, 4))} />}
        </Field>
        <div className="span-2">
          <Toggle label="Show on website" description="Display this certificate on the About page" checked={values.visible} onChange={(v) => set('visible', v)} />
        </div>
      </div>
    </Dialog>
  )
}

export default function CertificatesPage() {
  const { data, error, loading, reload } = useApi<CertificateRecord[]>('/admin/certificates')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<CertificateRecord | null>(null)
  // The open editor lives in the URL: ?edit=new creates, ?edit=12 edits (used by search and quick actions).
  const [editParam, setEditParam] = useQueryParam('edit')
  const editing: CertificateRecord | 'new' | null = editParam === 'new' ? 'new' : editParam ? (data?.find((x) => x.id === Number(editParam)) ?? null) : null
  const setEditing = (value: CertificateRecord | 'new' | null) => setEditParam(value === null ? null : value === 'new' ? 'new' : String(value.id))
  const notify = useToast()

  const all = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((c) => !q || [c.title, c.issuer, c.reference].some((f) => f?.toLowerCase().includes(q)))
  }, [all, query])
  const { rows, pages, current, start } = paginate(filtered, page)
  const nextOrder = (all.reduce((max, c) => Math.max(max, c.sortOrder), 0) || 0) + 10
  const expiring = all.filter((c) => c.expiryDate && c.expiryDate <= in90Days()).length

  const setVisible = async (certificate: CertificateRecord, visible: boolean) => {
    try {
      await api(`/admin/certificates/${certificate.id}`, { method: 'PUT', body: { ...certificate, visible } })
      notify(visible ? 'Certificate shown on About page' : 'Certificate hidden from website')
      reload()
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not update the certificate.', 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Manage the certificates displayed on the website’s About page"
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
            <Plus /> Add Certificate
          </button>
        }
      />

      <StatGrid
        loading={loading}
        stats={[
          { label: 'Total Certificates', value: all.length, icon: Award, tone: 'navy' },
          { label: 'Shown on About Page', value: all.filter((c) => c.visible).length, icon: Eye, tone: 'green' },
          { label: 'Expired or Expiring (90 days)', value: expiring, icon: CalendarClock, tone: expiring ? 'red' : 'gold' },
        ]}
      />

      <section className="card" aria-label="Certificates">
        <div className="toolbar">
          <SearchBox label="Search certificates" placeholder="Search by name, issuer or number…" value={query} onChange={(v) => (setQuery(v), setPage(1))} />
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
            icon={Award}
            title={all.length ? 'No certificates match your search' : 'No certificates yet'}
            text={all.length ? 'Try a different search term.' : 'Upload certificate scans to display them on the About page.'}
            action={
              !all.length && (
                <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
                  <Plus /> Add Certificate
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Certificate</th>
                  <th scope="col">Number</th>
                  <th scope="col">Expiry</th>
                  <th scope="col">Validity</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="col-action">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-media">
                        <img className="thumb thumb--doc" src={previewUrl(c.file)!} alt="" loading="lazy" />
                        <div style={{ minWidth: 0 }}>
                          <button type="button" className="cell-title row-link" onClick={() => setEditing(c)}>
                            {c.title}
                            {c.fileType === 'pdf' && <FileText size={13} style={{ display: 'inline', marginLeft: 6, verticalAlign: -1 }} aria-label="PDF" />}
                          </button>
                          <span className="cell-sub">{c.issuer}</span>
                        </div>
                      </div>
                    </td>
                    <td className="nowrap">{c.reference ?? '—'}</td>
                    <td className="nowrap">{c.expiryDate ?? '—'}</td>
                    <td>
                      <ExpiryBadge expiryDate={c.expiryDate} />
                    </td>
                    <td>
                      <VisibilityBadge visible={c.visible} />
                    </td>
                    <td className="col-action">
                      <RowMenu
                        label={`Actions for ${c.title}`}
                        actions={[
                          { label: 'Edit', icon: Pencil, onSelect: () => setEditing(c) },
                          { label: 'Open file', icon: ExternalLink, onSelect: () => window.open(fullUrl(c.file), '_blank', 'noopener') },
                          { label: 'Show on website', icon: Eye, onSelect: () => setVisible(c, true), hidden: c.visible },
                          { label: 'Hide from website', icon: EyeOff, onSelect: () => setVisible(c, false), hidden: !c.visible },
                          { label: 'Delete', icon: Trash2, onSelect: () => setDeleting(c), danger: true },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TableFooter total={filtered.length} page={current} pages={pages} start={start} onPage={setPage} />
      </section>

      {editing && (
        <CertificateEditor
          certificate={editing === 'new' ? null : editing}
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
          title="Delete certificate?"
          message={`"${deleting.title}" and its file will be permanently deleted and removed from the About page.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/certificates/${deleting.id}`, { method: 'DELETE' })
              notify('Certificate deleted')
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
