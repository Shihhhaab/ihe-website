import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Inbox,
  Mail,
  MailPlus,
  MessageSquareText,
  PhoneCall,
  Phone,
  Radio,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { ENQUIRY_SOURCE_LABELS, ENQUIRY_SOURCES, ENQUIRY_STATUS_LABELS, ENQUIRY_STATUSES } from '../../../shared/constants'
import type { Enquiry, EnquirySource, EnquiryStatus } from '../../../shared/types'
import { api, ApiError } from '../../shared/api'
import { ConfirmDialog, Dialog } from '../components/Modal'
import { RowMenu } from '../components/RowMenu'
import { useToast } from '../components/Toast'
import { Field } from '../components/form'
import { EmptyState, EnquiryBadge, ErrorNotice, PageHeader, SearchBox, StatGrid, TableFooter, TableSkeleton } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { useQueryParam } from '../hooks/useQueryParam'
import { paginate, shortDate } from '../lib/format'
import { useForm } from '../hooks/useForm'
import './pages.css'

function EnquiryDrawer({ enquiry, onClose, onStatus }: { enquiry: Enquiry; onClose: () => void; onStatus: (status: EnquiryStatus) => Promise<void> }) {
  const facts = [
    { icon: Building2, label: 'Company', value: enquiry.company ?? '—' },
    { icon: Mail, label: 'Email', value: enquiry.email, href: `mailto:${enquiry.email}` },
    { icon: Phone, label: 'Phone', value: enquiry.phone ?? '—', href: enquiry.phone ? `tel:${enquiry.phone.replace(/\s/g, '')}` : undefined },
    { icon: CalendarDays, label: 'Date Submitted', value: shortDate(enquiry.createdAt) },
    { icon: Radio, label: 'Source', value: ENQUIRY_SOURCE_LABELS[enquiry.source] },
  ]
  const reply = `mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: ${enquiry.requirement} (${enquiry.reference})`)}`

  return (
    <Dialog
      variant="drawer"
      title={enquiry.name}
      subtitle={`Enquiry ${enquiry.reference}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Close
          </button>
          <a className="btn btn--primary" href={reply}>
            Reply by Email
          </a>
        </>
      }
    >
      <EnquiryBadge status={enquiry.status} />
      <dl className="facts">
        {facts.map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="facts__item">
            <Icon aria-hidden="true" />
            <div>
              <dt>{label}</dt>
              <dd>{href ? <a href={href}>{value}</a> : value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <p className="detail-label">
        <MessageSquareText size={14} aria-hidden="true" /> Requirement
      </p>
      <p className="detail-highlight">{enquiry.requirement}</p>
      <p className="detail-label">Message</p>
      <p className="detail-box">{enquiry.message || 'No message provided.'}</p>
      <Field label="Update Status">
        {(a11y) => (
          <select {...a11y} className="select" value={enquiry.status} onChange={(e) => onStatus(e.target.value as EnquiryStatus)}>
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ENQUIRY_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        )}
      </Field>
    </Dialog>
  )
}

const emptyEnquiry = { name: '', company: '', email: '', phone: '', requirement: '', message: '', source: 'phone' as EnquirySource }

function AddEnquiryDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { values, set, errors, submitting, submit } = useForm(emptyEnquiry)
  const notify = useToast()

  return (
    <Dialog
      title="Add Enquiry"
      subtitle="Log an enquiry received by phone, email or in person"
      size="md"
      onClose={onClose}
      onSubmit={async (e) => {
        e.preventDefault()
        const ok = await submit(async (v) => {
          await api('/admin/enquiries', { method: 'POST', body: v })
        })
        if (ok) {
          notify('Enquiry saved')
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
            Save Enquiry
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Full Name" required error={errors.name}>
          {(a) => <input {...a} className="input" value={values.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Mohammed Al-Sulaiti" />}
        </Field>
        <Field label="Company" required error={errors.company}>
          {(a) => <input {...a} className="input" value={values.company} onChange={(e) => set('company', e.target.value)} placeholder="Company name" />}
        </Field>
        <Field label="Email" required error={errors.email}>
          {(a) => <input {...a} className="input" type="email" value={values.email} onChange={(e) => set('email', e.target.value)} placeholder="name@company.com" />}
        </Field>
        <Field label="Phone" required error={errors.phone}>
          {(a) => <input {...a} className="input" type="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+974 5555 5555" />}
        </Field>
        <Field label="Requirement" required error={errors.requirement} className="span-2">
          {(a) => <input {...a} className="input" value={values.requirement} onChange={(e) => set('requirement', e.target.value)} placeholder="e.g. Wheel loaders — 2 units" />}
        </Field>
        <Field label="Source" error={errors.source}>
          {(a) => (
            <select {...a} className="select" value={values.source} onChange={(e) => set('source', e.target.value as EnquirySource)}>
              {ENQUIRY_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {ENQUIRY_SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Message" error={errors.message} className="span-2">
          {(a) => <textarea {...a} className="textarea" value={values.message} onChange={(e) => set('message', e.target.value)} placeholder="Additional details…" />}
        </Field>
      </div>
    </Dialog>
  )
}

export default function EnquiriesPage() {
  const { data, error, loading, reload, setData } = useApi<Enquiry[]>('/admin/enquiries')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'' | EnquiryStatus>('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<Enquiry | null>(null)
  // Dialog state lives in the URL (?view=12, ?new=1) so the dashboard, notifications
  // and global search can link straight to it.
  const [viewParam, setViewParam] = useQueryParam('view')
  const [newParam, setNewParam] = useQueryParam('new')
  const viewing = viewParam ? Number(viewParam) : null
  const setViewing = (id: number | null) => setViewParam(id === null ? null : String(id))
  const adding = newParam !== null
  const setAdding = (open: boolean) => setNewParam(open ? '1' : null)
  const notify = useToast()

  const all = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter(
      (e) => (!status || e.status === status) && (!q || [e.name, e.company, e.requirement, e.email, e.reference].some((f) => f?.toLowerCase().includes(q))),
    )
  }, [all, query, status])
  const { rows, pages, current, start } = paginate(filtered, page)
  const count = (s: EnquiryStatus) => all.filter((e) => e.status === s).length

  const updateStatus = async (id: number, next: EnquiryStatus) => {
    try {
      const updated = await api<Enquiry>(`/admin/enquiries/${id}`, { method: 'PATCH', body: { status: next } })
      setData((list) => list?.map((e) => (e.id === id ? updated : e)))
      notify(`Marked as ${ENQUIRY_STATUS_LABELS[next]}`)
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not update status.', 'error')
    }
  }

  const viewed = all.find((e) => e.id === viewing) ?? null

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Track and respond to business enquiries submitted by prospective clients"
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
            <MailPlus /> Add Enquiry
          </button>
        }
      />

      <StatGrid
        loading={loading}
        stats={[
          { label: 'Total Enquiries', value: all.length, icon: Inbox, tone: 'navy' },
          { label: 'New', value: count('new'), icon: MailPlus, tone: 'red' },
          { label: 'In Progress', value: count('in_progress'), icon: Clock3, tone: 'gold' },
          { label: 'Closed', value: count('closed'), icon: CheckCircle2, tone: 'navy' },
        ]}
      />

      <section className="card" aria-label="Enquiries">
        <div className="toolbar">
          <SearchBox
            label="Search enquiries"
            placeholder="Search by name, company or requirement…"
            value={query}
            onChange={(v) => {
              setQuery(v)
              setPage(1)
            }}
          />
          <select
            className="select"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as EnquiryStatus | '')
              setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ENQUIRY_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div style={{ padding: '0 24px' }}>
            <ErrorNotice message={error.message} onRetry={reload} />
          </div>
        )}

        {loading ? (
          <TableSkeleton cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={all.length ? 'No enquiries match your filters' : 'No enquiries yet'}
            text={all.length ? 'Try a different search term or status.' : 'Enquiries submitted through the website contact form will appear here.'}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Company</th>
                  <th scope="col">Requirement</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="col-action">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <button type="button" className="strong row-link" onClick={() => setViewing(e.id)}>
                        {e.name}
                      </button>
                    </td>
                    <td>{e.company ?? '—'}</td>
                    <td>{e.requirement}</td>
                    <td className="nowrap">{shortDate(e.createdAt)}</td>
                    <td>
                      <EnquiryBadge status={e.status} />
                    </td>
                    <td className="col-action">
                      <RowMenu
                        label={`Actions for ${e.name}`}
                        actions={[
                          { label: 'View Details', icon: Eye, onSelect: () => setViewing(e.id) },
                          { label: 'Mark In Progress', icon: Clock3, onSelect: () => updateStatus(e.id, 'in_progress'), hidden: e.status === 'in_progress' },
                          { label: 'Mark Contacted', icon: PhoneCall, onSelect: () => updateStatus(e.id, 'contacted'), hidden: e.status === 'contacted' },
                          { label: 'Mark as Closed', icon: CheckCircle2, onSelect: () => updateStatus(e.id, 'closed'), hidden: e.status === 'closed' },
                          { label: 'Delete', icon: Trash2, onSelect: () => setDeleting(e), danger: true },
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

      {viewed && <EnquiryDrawer enquiry={viewed} onClose={() => setViewing(null)} onStatus={(s) => updateStatus(viewed.id, s)} />}
      {adding && (
        <AddEnquiryDialog
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            reload()
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete enquiry?"
          message={`${deleting.name}'s enquiry (${deleting.reference}) will be permanently deleted.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/enquiries/${deleting.id}`, { method: 'DELETE' })
              setData((list) => list?.filter((e) => e.id !== deleting.id))
              notify('Enquiry deleted')
            } catch (err) {
              notify(err instanceof ApiError ? err.message : 'Could not delete.', 'error')
            }
          }}
        />
      )}
    </>
  )
}
