import {
  Award,
  ClipboardList,
  CheckCircle2,
  Clock3,
  FilePlus2,
  HardHat,
  MessageSquareText,
  Newspaper,
  Settings,
  UserPlus,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ActivityItem, DashboardSummary, ProjectRecord } from '../../../shared/types'
import { useAuth, useCurrentUser } from '../auth/AuthContext'
import { EmptyState, EnquiryBadge, ErrorNotice, StatGrid, TableSkeleton, type StatProps } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { relativeTime, shortDate } from '../lib/format'
import './dashboard.css'

const ACTIVITY_ICONS: Record<ActivityItem['kind'], LucideIcon> = {
  enquiry: MessageSquareText,
  project: HardHat,
  blog: Newspaper,
  service: ClipboardList,
  certificate: Award,
  user: UserRound,
  settings: Settings,
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
}

function ProjectColumn({ title, icon: Icon, tone, projects, to }: { title: string; icon: LucideIcon; tone: string; projects: ProjectRecord[]; to: string }) {
  const navigate = useNavigate()
  return (
    <div className="overview-col">
      <div className="overview-col__head">
        <span className={`overview-col__icon tone-${tone}`} aria-hidden="true">
          <Icon size={16} />
        </span>
        <span className="overview-col__title">{title}</span>
        <span className="overview-col__count">{projects.length}</span>
      </div>
      {projects.length === 0 ? (
        <p className="muted" style={{ fontSize: 13, padding: '8px 0' }}>
          None yet.
        </p>
      ) : (
        <ul>
          {projects.slice(0, 3).map((p) => (
            <li key={p.id} className="overview-item">
              <p className="overview-item__title">{p.title}</p>
              <p className="overview-item__sub">
                {p.client} · {p.location}
              </p>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn btn--secondary btn--sm btn--block" onClick={() => navigate(to)}>
        View all →
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const user = useCurrentUser()
  const { can } = useAuth()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useApi<DashboardSummary>('/admin/dashboard')

  const stats: StatProps[] = [
    ...(can('enquiries')
      ? [{ label: 'Total Enquiries', value: data?.enquiries.total ?? 0, icon: MessageSquareText, tone: 'red' as const, note: `+${data?.enquiries.thisMonth ?? 0} this month` }]
      : []),
    { label: 'Current Projects', value: data?.projects.current.length ?? 0, icon: HardHat, tone: 'navy', note: `${data?.projects.dueThisQuarter ?? 0} due this quarter` },
    { label: 'Services', value: data?.services.total ?? 0, icon: ClipboardList, tone: 'gold', note: data?.services.hidden ? `${data.services.hidden} hidden` : 'All shown on website' },
    { label: 'Blog Posts', value: data?.blogs.total ?? 0, icon: Newspaper, tone: 'navy', note: `${data?.blogs.drafts ?? 0} drafts pending` },
  ]

  const quickActions = [
    { label: 'Add Blog', icon: FilePlus2, to: '/blogs?edit=new', show: can('blogs') },
    { label: 'Add Current Project', icon: HardHat, to: '/projects/current?edit=new', show: can('projects') },
    { label: 'Add Service', icon: ClipboardList, to: '/services?edit=new', show: can('services') },
    { label: 'Add Enquiry', icon: UserPlus, to: '/enquiries?new=1', show: can('enquiries') },
  ].filter((a) => a.show)

  const firstName = user.name.split(' ')[0]
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <header className="page-head">
        <div>
          <h1 style={{ fontSize: 32 }}>
            {greeting()}, {firstName}
          </h1>
          <p>Manage International Heavy Equipment business information and projects</p>
        </div>
        <div className="card date-card">
          <p className="date-card__day">{today}</p>
          <p className="date-card__place">Doha, Qatar</p>
        </div>
      </header>

      {error && <ErrorNotice message={error.message} onRetry={reload} />}

      <StatGrid stats={stats} loading={loading} />

      <div className="dash-grid">
        {can('enquiries') && (
          <section className="card dash-grid__main" aria-labelledby="recent-enquiries">
            <div className="card__head">
              <div>
                <h2 id="recent-enquiries">Recent Enquiries</h2>
                <p>Latest business enquiries submitted through the website</p>
              </div>
            </div>
            {loading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : data?.enquiries.recent.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Company</th>
                      <th scope="col">Requirement</th>
                      <th scope="col">Date</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.enquiries.recent.map((e) => (
                      <tr key={e.id} className="clickable-row" onClick={() => navigate(`/enquiries?view=${e.id}`)}>
                        <td className="strong">{e.name}</td>
                        <td>{e.company ?? '—'}</td>
                        <td>{e.requirement}</td>
                        <td className="nowrap">{shortDate(e.createdAt)}</td>
                        <td>
                          <EnquiryBadge status={e.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={MessageSquareText} title="No enquiries yet" text="Enquiries submitted through the website contact form will appear here." />
            )}
            <div className="card__body" style={{ paddingTop: 12, textAlign: 'right' }}>
              <button type="button" className="link-btn" onClick={() => navigate('/enquiries')}>
                View all enquiries →
              </button>
            </div>
          </section>
        )}

        <section className="card" aria-labelledby="quick-actions">
          <div className="card__head">
            <h2 id="quick-actions">Quick Actions</h2>
          </div>
          <div className="card__body quick-actions">
            {quickActions.map(({ label, icon: Icon, to }) => (
              <button key={label} type="button" className="quick-action" onClick={() => navigate(to)}>
                <span className="quick-action__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                {label}
              </button>
            ))}
          </div>
        </section>

        {can('projects') && (
          <section className="card dash-grid__main" aria-labelledby="project-overview">
            <div className="card__head">
              <div>
                <h2 id="project-overview">Project Overview</h2>
                <p>A snapshot across current, completed and pending work</p>
              </div>
            </div>
            <div className="card__body overview">
              {loading || !data ? (
                <TableSkeleton rows={3} cols={3} />
              ) : (
                <>
                  <ProjectColumn title="Current Projects" icon={HardHat} tone="gold" projects={data.projects.current} to="/projects/current" />
                  <ProjectColumn title="Completed Projects" icon={CheckCircle2} tone="green" projects={data.projects.completed} to="/projects/completed" />
                  <ProjectColumn title="Pending Projects" icon={Clock3} tone="navy" projects={data.projects.pending} to="/projects/pending" />
                </>
              )}
            </div>
          </section>
        )}

        <section className="card" aria-labelledby="recent-activity">
          <div className="card__head">
            <h2 id="recent-activity">Recent Activity</h2>
          </div>
          <div className="card__body">
            {data?.activity.length ? (
              <ol className="activity">
                {data.activity.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.kind] ?? Settings
                  return (
                    <li key={a.id} className="activity__item">
                      <span className="activity__icon" aria-hidden="true">
                        <Icon size={15} />
                      </span>
                      <div>
                        <p className="activity__title">{a.title}</p>
                        <p className="activity__detail">{a.detail}</p>
                        <p className="activity__time">
                          <time dateTime={a.createdAt}>{relativeTime(a.createdAt)}</time>
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : (
              !loading && <p className="muted" style={{ fontSize: 13 }}>Activity from you and your team will appear here.</p>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
