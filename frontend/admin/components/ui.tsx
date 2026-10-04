import { ChevronLeft, ChevronRight, Inbox, Search, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ENQUIRY_STATUS_LABELS } from '../../../shared/constants'
import type { BlogStatus, EnquiryStatus, UserStatus } from '../../../shared/types'
import { cloudinaryUrl } from '../../../shared/cloudinary'
import { initials, PAGE_SIZE } from '../lib/format'

/* ─── Page header ─────────────────────────────────────────── */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </header>
  )
}

/* ─── Stat cards ──────────────────────────────────────────── */

export type Tone = 'red' | 'gold' | 'navy' | 'green'

export interface StatProps {
  label: string
  value: ReactNode
  icon: LucideIcon
  tone?: Tone
  note?: ReactNode
}

export function StatCard({ label, value, icon: Icon, tone = 'navy', note }: StatProps) {
  return (
    <div className="card stat">
      <span className={`stat__icon tone-${tone}`} aria-hidden="true">
        <Icon />
      </span>
      <div>
        <p className="stat__label">{label}</p>
        <p className="stat__value">{value}</p>
        {note && <p className="stat__note">{note}</p>}
      </div>
    </div>
  )
}

export function StatGrid({ stats, loading }: { stats: StatProps[]; loading?: boolean }) {
  return (
    <div className="stat-grid" style={{ ['--cols' as string]: stats.length }}>
      {stats.map((s) => (
        <StatCard key={s.label} {...s} value={loading ? <span className="skeleton" style={{ display: 'block', width: 48, height: 30 }} /> : s.value} />
      ))}
    </div>
  )
}

/* ─── Status badges ───────────────────────────────────────── */

const ENQUIRY_TONES: Record<EnquiryStatus, string> = { new: 'blue', in_progress: 'amber', contacted: 'amber', closed: 'gray' }

export const Badge = ({ tone, children }: { tone: string; children: ReactNode }) => <span className={`badge badge--dot badge--${tone}`}>{children}</span>

export const EnquiryBadge = ({ status }: { status: EnquiryStatus }) => <Badge tone={ENQUIRY_TONES[status]}>{ENQUIRY_STATUS_LABELS[status]}</Badge>

/** Whether a service or certificate is shown on the public website. */
export const VisibilityBadge = ({ visible }: { visible: boolean }) => <Badge tone={visible ? 'green' : 'gray'}>{visible ? 'Shown' : 'Hidden'}</Badge>

export const BlogBadge = ({ status }: { status: BlogStatus }) => (
  <Badge tone={status === 'published' ? 'green' : 'gray'}>{status === 'published' ? 'Published' : 'Draft'}</Badge>
)

export const UserBadge = ({ status }: { status: UserStatus }) => (
  <Badge tone={status === 'active' ? 'green' : 'gray'}>{status === 'active' ? 'Active' : 'Inactive'}</Badge>
)

/* ─── Pagination ──────────────────────────────────────────── */

export function TableFooter({ total, page, pages, start, size = PAGE_SIZE, onPage }: { total: number; page: number; pages: number; start: number; size?: number; onPage: (p: number) => void }) {
  if (total === 0) return null
  return (
    <div className="table-foot">
      <span>
        Showing <strong>{start + 1}</strong>–<strong>{Math.min(start + size, total)}</strong> of <strong>{total}</strong>
      </span>
      <nav className="pagination" aria-label="Pagination">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button key={p} type="button" onClick={() => onPage(p)} aria-current={p === page ? 'page' : undefined}>
            {p}
          </button>
        ))}
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">
          <ChevronRight />
        </button>
      </nav>
    </div>
  )
}

/* ─── Search box ──────────────────────────────────────────── */

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <label className="search">
      <Search aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input type="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

/* ─── Empty, loading & error states ───────────────────────── */

export function EmptyState({ icon: Icon = Inbox, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty__icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <p className="empty__title">{title}</p>
      {text && <p className="empty__text">{text}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, padding: '18px 16px', borderBottom: '1px solid var(--border)' }}>
          {Array.from({ length: cols }, (_, c) => (
            <span key={c} className="skeleton" style={{ height: 14, width: `${60 + ((r + c) % 3) * 15}%` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert--error" role="alert">
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button type="button" className="link-btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

/* ─── Misc ────────────────────────────────────────────────── */

export function Avatar({ name, src, size }: { name: string; src?: string | null; size?: 'lg' }) {
  return (
    <span className={`avatar ${size === 'lg' ? 'avatar--lg' : ''}`} aria-hidden="true">
      {src ? <img src={cloudinaryUrl(src, 160)} alt="" /> : initials(name)}
    </span>
  )
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
      <span className="progress__track">
        <span className="progress__bar" style={{ width: `${value}%`, display: 'block' }} />
      </span>
      <span className="progress__value">{value}%</span>
    </div>
  )
}
