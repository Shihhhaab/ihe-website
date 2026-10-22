import {
  Banknote,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  HardHat,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES } from '../../../shared/constants'
import { formatQarFull } from '../../../shared/format'
import type { ProjectRecord, ProjectStatus } from '../../../shared/types'
import { api, ApiError } from '../../shared/api'
import { previewUrl } from '../../shared/images'
import { ConfirmDialog, Dialog } from '../components/Modal'
import { RowMenu, type MenuAction } from '../components/RowMenu'
import { useToast } from '../components/Toast'
import { Field, ImageInput, Toggle } from '../components/form'
import { EmptyState, ErrorNotice, PageHeader, ProgressBar, SearchBox, StatGrid, type StatProps } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { useQueryParam } from '../hooks/useQueryParam'
import NotFoundPage from './NotFoundPage'
import { toNumberOrNull } from '../lib/format'
import { useForm } from '../hooks/useForm'
import './pages.css'

/** Statuses with an admin page. Pending records stay in the database but no longer have a page. */
type AdminStatus = Exclude<ProjectStatus, 'pending'>
const ADMIN_STATUSES = PROJECT_STATUSES.filter((s): s is AdminStatus => s !== 'pending')

const PAGE_COPY: Record<AdminStatus, { title: string; description: string; dateLabel: string }> = {
  current: { title: 'Current Projects', description: 'Ongoing projects and their progress across Qatar', dateLabel: 'Target' },
  completed: { title: 'Completed Projects', description: 'Delivered projects and their completion dates', dateLabel: 'Completed' },
}

type Draft = {
  title: string
  client: string
  location: string
  description: string
  scope: string
  valueQar: string
  status: ProjectStatus
  startDate: string
  endDate: string
  progress: number
  image: string | null
  imageAlt: string
  featured: boolean
}

function ProjectEditor({ project, status, onClose, onSaved }: { project: ProjectRecord | null; status: AdminStatus; onClose: () => void; onSaved: (p: ProjectRecord) => void }) {
  const { values, set, errors, submitting, submit } = useForm<Draft>({
    title: project?.title ?? '',
    client: project?.client ?? '',
    location: project?.location ?? '',
    description: project?.description ?? '',
    scope: project?.scope ?? '',
    valueQar: project?.valueQar?.toString() ?? '',
    status: project?.status ?? status,
    startDate: project?.startDate ?? '',
    endDate: project?.endDate ?? '',
    progress: project?.progress ?? 0,
    image: project?.image || null,
    imageAlt: project?.imageAlt ?? '',
    featured: project?.featured ?? false,
  })
  const notify = useToast()

  return (
    <Dialog
      title={project ? 'Edit Project' : 'Add Project'}
      subtitle={project ? project.title : 'Add a new project to the portfolio'}
      onClose={onClose}
      onSubmit={async (e) => {
        e.preventDefault()
        const result: { saved?: ProjectRecord } = {}
        const ok = await submit(async (v) => {
          const body = { ...v, valueQar: toNumberOrNull(v.valueQar), image: v.image ?? '', progress: v.status === 'current' ? v.progress : null }
          result.saved = await api<ProjectRecord>(project ? `/admin/projects/${project.id}` : '/admin/projects', { method: project ? 'PUT' : 'POST', body })
        })
        if (ok && result.saved) {
          notify(project ? 'Project updated' : 'Project added')
          onSaved(result.saved)
        }
      }}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting && <span className="spinner" />}
            Save Project
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Project Name" required error={errors.title} className="span-2">
          {(a) => <input {...a} className="input" value={values.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Al Khor Industrial Road Upgrade" />}
        </Field>
        <Field label="Client" required error={errors.client}>
          {(a) => <input {...a} className="input" value={values.client} onChange={(e) => set('client', e.target.value)} placeholder="e.g. Ashghal — Public Works Authority" />}
        </Field>
        <Field label="Location" required error={errors.location}>
          {(a) => <input {...a} className="input" value={values.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Al Khor, Qatar" />}
        </Field>
        <Field label="Description" required error={errors.description} className="span-2" hint="Shown on the website project cards.">
          {(a) => <textarea {...a} className="textarea" style={{ minHeight: 76 }} value={values.description} onChange={(e) => set('description', e.target.value)} />}
        </Field>
        <Field label="Scope of Work" error={errors.scope} className="span-2">
          {(a) => <textarea {...a} className="textarea" style={{ minHeight: 76 }} value={values.scope} onChange={(e) => set('scope', e.target.value)} />}
        </Field>
        <Field label="Project Value (QAR)" error={errors.valueQar}>
          {(a) => <input {...a} className="input" inputMode="numeric" value={values.valueQar} onChange={(e) => set('valueQar', e.target.value.replace(/[^\d]/g, ''))} placeholder="e.g. 9750000" />}
        </Field>
        <Field label="Status" error={errors.status}>
          {(a) => (
            <select {...a} className="select" value={values.status} onChange={(e) => set('status', e.target.value as ProjectStatus)}>
              {ADMIN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Start Date" error={errors.startDate} hint="YYYY or YYYY-MM-DD">
          {(a) => <input {...a} className="input" value={values.startDate} onChange={(e) => set('startDate', e.target.value.trim())} placeholder="2026-03-01" />}
        </Field>
        <Field label={values.status === 'completed' ? 'Completion Date' : 'Target Completion'} error={errors.endDate} hint="YYYY or YYYY-MM-DD">
          {(a) => <input {...a} className="input" value={values.endDate} onChange={(e) => set('endDate', e.target.value.trim())} placeholder="2026-12-20" />}
        </Field>
        {values.status === 'current' && (
          <Field label={`Progress — ${values.progress}%`} error={errors.progress} className="span-2">
            {(a) => <input {...a} className="range" type="range" min={0} max={100} step={1} value={values.progress} onChange={(e) => set('progress', Number(e.target.value))} />}
          </Field>
        )}
        <div className="span-2">
          <ImageInput folder="projects" label="Project Image" value={values.image} onChange={(v) => set('image', v)} error={errors.image} />
        </div>
        <Field label="Image description (alt text)" error={errors.imageAlt} className="span-2">
          {(a) => <input {...a} className="input" value={values.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} />}
        </Field>
        <div className="span-2">
          <Toggle label="Featured Project" description="Highlight this project on the public website" checked={values.featured} onChange={(v) => set('featured', v)} />
        </div>
      </div>
    </Dialog>
  )
}

function ProjectCard({ project, actions }: { project: ProjectRecord; actions: MenuAction[] }) {
  const image = previewUrl(project.image)
  const date = project.endDate
  return (
    <article className="card project-card">
      <div className="project-card__media">
        {image ? <img src={image} alt={project.imageAlt} loading="lazy" /> : <span className="project-card__placeholder">{project.title}</span>}
        {project.featured && (
          <span className="project-card__featured">
            <Star size={12} fill="currentColor" aria-hidden="true" /> Featured
          </span>
        )}
        <RowMenu className="project-card__menu" vertical label={`Actions for ${project.title}`} actions={actions} />
      </div>
      <div className="project-card__body">
        <h3 className="project-card__title">{project.title}</h3>
        <p className="project-card__meta">
          <span>
            <Building2 aria-hidden="true" /> {project.client}
          </span>
          <span>
            <MapPin aria-hidden="true" /> {project.location}
          </span>
        </p>
        <p className="project-card__desc">{project.description}</p>
        {project.status === 'current' && project.progress !== null && <ProgressBar value={project.progress} />}
        <div className="project-card__foot">
          <p className="project-card__value">
            <Banknote aria-hidden="true" /> {formatQarFull(project.valueQar)}
          </p>
          {date && (
            <p className="project-card__date">
              <CalendarDays aria-hidden="true" /> {PAGE_COPY[project.status as AdminStatus].dateLabel}: {date}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

export default function ProjectsPage() {
  const { status: param } = useParams()
  if (!ADMIN_STATUSES.includes(param as AdminStatus)) return <NotFoundPage />
  return <ProjectsList key={param} status={param as AdminStatus} />
}

function ProjectsList({ status }: { status: AdminStatus }) {
  const { data, error, loading, reload } = useApi<ProjectRecord[]>(`/admin/projects?status=${status}`)
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [deleting, setDeleting] = useState<ProjectRecord | null>(null)
  // The open editor lives in the URL: ?edit=new creates, ?edit=12 edits (used by search and quick actions).
  const [editParam, setEditParam] = useQueryParam('edit')
  const editing: ProjectRecord | 'new' | null = editParam === 'new' ? 'new' : editParam ? (data?.find((x) => x.id === Number(editParam)) ?? null) : null
  const setEditing = (value: ProjectRecord | 'new' | null) => setEditParam(value === null ? null : value === 'new' ? 'new' : String(value.id))
  const notify = useToast()
  const copy = PAGE_COPY[status]

  const all = useMemo(() => data ?? [], [data])
  const locations = Array.from(new Set(all.map((p) => p.location))).sort()
  const filtered = all.filter((p) => {
    const q = query.trim().toLowerCase()
    return (!location || p.location === location) && (!q || [p.title, p.client].some((f) => f.toLowerCase().includes(q)))
  })

  const moveTo = async (p: ProjectRecord, next: AdminStatus) => {
    try {
      await api(`/admin/projects/${p.id}`, { method: 'PUT', body: { ...p, status: next, progress: next === 'current' ? (p.progress ?? 0) : null } })
      notify(`Moved to ${PAGE_COPY[next].title}`)
      reload()
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not move the project.', 'error')
    }
  }

  const withProgress = all.filter((p) => p.progress !== null)
  const stats: StatProps[] = [
    { label: `Total ${copy.title}`, value: all.length, icon: Briefcase, tone: 'navy' },
    { label: 'Featured Projects', value: all.filter((p) => p.featured).length, icon: Star, tone: 'gold' },
    status === 'current'
      ? {
          label: 'Average Progress',
          value: withProgress.length ? `${Math.round(withProgress.reduce((s, p) => s + (p.progress ?? 0), 0) / withProgress.length)}%` : '—',
          icon: BarChart3,
          tone: 'red',
        }
      : { label: 'Locations', value: locations.length, icon: MapPin, tone: 'red' },
  ]

  const StatusIcon = status === 'current' ? HardHat : CheckCircle2

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
            <Plus /> Add Project
          </button>
        }
      />

      <StatGrid stats={stats} loading={loading} />

      <div className="toolbar toolbar--flush">
        <SearchBox label="Search projects" placeholder="Search by project name or client…" value={query} onChange={setQuery} />
        <select className="select" aria-label="Filter by location" value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">All Locations</option>
          {locations.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>

      {error && <ErrorNotice message={error.message} onRetry={reload} />}

      {loading ? (
        <div className="project-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card skeleton" style={{ height: 420 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={StatusIcon}
            title={all.length ? 'No projects match your filters' : `No ${copy.title.toLowerCase()} yet`}
            text={all.length ? 'Try a different search or location.' : 'Add a project to show it here.'}
            action={
              !all.length && (
                <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
                  <Plus /> Add Project
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="project-grid">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              actions={[
                { label: 'Edit', icon: Pencil, onSelect: () => setEditing(p) },
                { label: 'View on website', icon: ExternalLink, onSelect: () => window.open(`/projects#${p.slug}`, '_blank', 'noopener') },
                ...ADMIN_STATUSES.filter((s) => s !== p.status).map((s) => ({
                  label: `Move to ${PROJECT_STATUS_LABELS[s]}`,
                  icon: s === 'completed' ? CheckCircle2 : HardHat,
                  onSelect: () => moveTo(p, s),
                })),
                { label: 'Delete', icon: Trash2, onSelect: () => setDeleting(p), danger: true },
              ]}
            />
          ))}
        </div>
      )}

      {editing && (
        <ProjectEditor
          project={editing === 'new' ? null : editing}
          status={status}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null)
            if (saved.status !== status) notify(`Saved to ${PAGE_COPY[saved.status as AdminStatus].title}`)
            reload()
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete project?"
          message={`"${deleting.title}" will be permanently deleted and removed from the website.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/projects/${deleting.id}`, { method: 'DELETE' })
              notify('Project deleted')
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
