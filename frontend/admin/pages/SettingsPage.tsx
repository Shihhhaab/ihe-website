import { Bell, Building2, Info, LogOut, Monitor, ShieldCheck, Smartphone, UserRound } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ROLE_LABELS, TIMEZONES } from '../../../shared/constants'
import type { AdminUser, CompanySettings, NotificationPrefs, SessionInfo } from '../../../shared/types'
import { PASSWORD_MIN } from '../../../shared/validation'
import { api, ApiError } from '../../shared/api'
import { useAuth, useCurrentUser } from '../auth/AuthContext'
import { useToast } from '../components/Toast'
import { Field, ImageInput, Toggle } from '../components/form'
import { ErrorNotice, PageHeader } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { relativeTime } from '../lib/format'
import { useForm } from '../hooks/useForm'
import './pages.css'

const TABS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'profile', label: 'Admin Profile', icon: UserRound },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const

type TabId = (typeof TABS)[number]['id']

function GeneralTab() {
  const { can } = useAuth()
  const { data, error, reload } = useApi<CompanySettings>('/admin/settings/company')
  if (error) return <ErrorNotice message={error.message} onRetry={reload} />
  if (!data) return <div className="skeleton" style={{ height: 360 }} />
  return <GeneralForm key={JSON.stringify(data)} initial={data} readOnly={!can('company')} onSaved={reload} />
}

function GeneralForm({ initial, readOnly, onSaved }: { initial: CompanySettings; readOnly: boolean; onSaved: () => void }) {
  const { values, set, setValues, errors, submitting, submit } = useForm(initial)
  const notify = useToast()
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        if (await submit((v) => api('/admin/settings/company', { method: 'PUT', body: v }))) {
          notify('Company details saved')
          onSaved()
        }
      }}
    >
      {readOnly && (
        <div className="alert alert--info" style={{ marginBottom: 20 }}>
          <Info /> Only super admins can change company details.
        </div>
      )}
      <fieldset disabled={readOnly} style={{ border: 0, padding: 0 }}>
        <div className="form-grid">
          <Field label="Company Name" required error={errors.companyName}>
            {(a) => <input {...a} className="input" value={values.companyName} onChange={(e) => set('companyName', e.target.value)} />}
          </Field>
          <Field label="Company Email" required error={errors.companyEmail}>
            {(a) => <input {...a} className="input" type="email" value={values.companyEmail} onChange={(e) => set('companyEmail', e.target.value)} />}
          </Field>
          <Field label="Company Phone" error={errors.companyPhone}>
            {(a) => <input {...a} className="input" type="tel" value={values.companyPhone} onChange={(e) => set('companyPhone', e.target.value)} />}
          </Field>
          <Field label="Timezone" error={errors.timezone}>
            {(a) => (
              <select {...a} className="select" value={values.timezone} onChange={(e) => set('timezone', e.target.value)}>
                {TIMEZONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Company Address" error={errors.companyAddress} className="span-2">
            {(a) => <textarea {...a} className="textarea" style={{ minHeight: 76 }} value={values.companyAddress} onChange={(e) => set('companyAddress', e.target.value)} />}
          </Field>
          <div className="span-2">
            {!readOnly && (
              <ImageInput
                folder="branding"
                label="Company Logo"
                value={values.logoUrl}
                onChange={(v) => set('logoUrl', v)}
                hint="SVG-style PNG with a transparent background works best."
                library={false}
                error={errors.logoUrl}
              />
            )}
          </div>
        </div>
      </fieldset>
      {!readOnly && (
        <div className="settings-actions">
          <button type="button" className="btn btn--secondary" onClick={() => setValues(initial)} disabled={submitting}>
            Discard Changes
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting && <span className="spinner" />}
            Save Changes
          </button>
        </div>
      )}
    </form>
  )
}

function ProfileTab() {
  const user = useCurrentUser()
  const { setUser } = useAuth()
  const initial = { name: user.name, email: user.email, phone: user.phone ?? '', bio: user.bio ?? '', avatarUrl: user.avatarUrl }
  const { values, set, setValues, errors, submitting, submit } = useForm(initial)
  const notify = useToast()

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        const result: { saved?: AdminUser } = {}
        const ok = await submit(async (v) => {
          result.saved = await api<AdminUser>('/admin/settings/profile', { method: 'PUT', body: v })
        })
        if (ok && result.saved) {
          setUser(result.saved)
          notify('Profile saved')
        }
      }}
    >
      <div className="form-grid">
        <div className="span-2" style={{ maxWidth: 360 }}>
          <ImageInput label="Profile Photo" value={values.avatarUrl} onChange={(v) => set('avatarUrl', v)} folder="avatars" library={false} hint="Square image recommended, at least 300×300px" error={errors.avatarUrl} />
        </div>
        <Field label="Full Name" required error={errors.name}>
          {(a) => <input {...a} className="input" value={values.name} onChange={(e) => set('name', e.target.value)} />}
        </Field>
        <Field label="Email Address" required error={errors.email}>
          {(a) => <input {...a} className="input" type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />}
        </Field>
        <Field label="Phone Number" error={errors.phone}>
          {(a) => <input {...a} className="input" type="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} />}
        </Field>
        <Field label="Role" hint="Roles are managed by super admins in Users.">
          {(a) => <input {...a} className="input" value={ROLE_LABELS[user.role]} disabled />}
        </Field>
        <Field label="Short Bio" error={errors.bio} className="span-2" hint="Shown on your admin profile card.">
          {(a) => <textarea {...a} className="textarea" value={values.bio} maxLength={400} onChange={(e) => set('bio', e.target.value)} />}
        </Field>
      </div>
      <div className="settings-actions">
        <button type="button" className="btn btn--secondary" onClick={() => setValues(initial)} disabled={submitting}>
          Discard Changes
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting && <span className="spinner" />}
          Save Profile
        </button>
      </div>
    </form>
  )
}

function describeAgent(ua: string | null) {
  if (!ua) return { label: 'Unknown device', mobile: false }
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS'
  return { label: `${browser} on ${os}`, mobile: /Mobile|iPhone|Android/.test(ua) }
}

function SecurityTab() {
  const { values, set, setValues, errors, submitting, submit } = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const sessions = useApi<SessionInfo[]>('/admin/settings/sessions')
  const notify = useToast()

  const revoke = async (id: number) => {
    try {
      await api(`/admin/settings/sessions/${id}`, { method: 'DELETE' })
      notify('Session signed out')
      sessions.reload()
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not sign out that session.', 'error')
    }
  }

  return (
    <>
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault()
          if (await submit((v) => api('/admin/settings/password', { method: 'PUT', body: v }))) {
            setValues({ currentPassword: '', newPassword: '', confirmPassword: '' })
            notify('Password updated. Other sessions were signed out.')
            sessions.reload()
          }
        }}
      >
        <h2 className="section-title">Change password</h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
          Changing your password signs you out of every other device.
        </p>
        <div className="form-grid">
          <Field label="Current Password" required error={errors.currentPassword} className="span-2">
            {(a) => <input {...a} className="input" type="password" autoComplete="current-password" value={values.currentPassword} onChange={(e) => set('currentPassword', e.target.value)} />}
          </Field>
          <Field label="New Password" required error={errors.newPassword} hint={`At least ${PASSWORD_MIN} characters, with letters and numbers.`}>
            {(a) => <input {...a} className="input" type="password" autoComplete="new-password" value={values.newPassword} onChange={(e) => set('newPassword', e.target.value)} />}
          </Field>
          <Field label="Confirm New Password" required error={errors.confirmPassword}>
            {(a) => <input {...a} className="input" type="password" autoComplete="new-password" value={values.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />}
          </Field>
        </div>
        <div className="settings-actions">
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting && <span className="spinner" />}
            Update Password
          </button>
        </div>
      </form>

      <div style={{ marginTop: 32 }}>
        <h2 className="section-title">Active Sessions</h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Devices currently signed in to your account.
        </p>
        {sessions.data?.map((s) => {
          const { label, mobile } = describeAgent(s.userAgent)
          const Icon = mobile ? Smartphone : Monitor
          return (
            <div className="session" key={s.id}>
              <span className="session__icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <div style={{ flex: 1 }}>
                <p className="session__title">{label}</p>
                <p className="session__sub">{s.current ? 'Current session · Active now' : `Last active ${relativeTime(s.lastSeenAt).toLowerCase()}`}</p>
              </div>
              {!s.current && (
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => revoke(s.id)}>
                  <LogOut /> Revoke
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

const NOTIFICATION_OPTIONS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'newEnquiry', label: 'New Enquiry Alerts', description: 'Get notified by email when a new enquiry is submitted' },
  { key: 'weeklySummary', label: 'Weekly Summary Report', description: 'Receive a weekly overview of enquiries, projects and website content' },
  { key: 'projectStatus', label: 'Project Status Updates', description: "Notify me when a project's progress or status changes" },
  { key: 'contentUpdates', label: 'Services & Certificates Updates', description: 'Notify me when services or certificates are added, changed or removed' },
  { key: 'systemAlerts', label: 'System Alerts', description: 'Important updates about the admin dashboard itself' },
]

function NotificationsTab() {
  const { data, error, reload } = useApi<NotificationPrefs>('/admin/settings/notifications')
  if (error) return <ErrorNotice message={error.message} onRetry={reload} />
  if (!data) return <div className="skeleton" style={{ height: 300 }} />
  return <NotificationsForm initial={data} />
}

function NotificationsForm({ initial }: { initial: NotificationPrefs }) {
  const { values, set, submitting, submit } = useForm(initial)
  const notify = useToast()
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        if (await submit((v) => api('/admin/settings/notifications', { method: 'PUT', body: v }))) notify('Preferences saved')
      }}
    >
      <div className="alert alert--info" style={{ marginBottom: 22 }}>
        <Info /> Your preferences are saved now. Email delivery starts once an email service is connected to the server.
      </div>
      <div className="toggle-list">
        {NOTIFICATION_OPTIONS.map((o) => (
          <Toggle key={o.key} label={o.label} description={o.description} checked={values[o.key]} onChange={(v) => set(o.key, v)} />
        ))}
      </div>
      <div className="settings-actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting && <span className="spinner" />}
          Save Preferences
        </button>
      </div>
    </form>
  )
}

export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  // The active tab lives in the URL (?tab=security) so it can be linked to, e.g. from the profile menu.
  const requested = params.get('tab')
  const tab: TabId = TABS.find((t) => t.id === requested)?.id ?? 'general'
  const select = (id: TabId) => setParams(id === 'general' ? {} : { tab: id }, { replace: true })

  return (
    <>
      <PageHeader title="Settings" description="Configure company details, your profile, security and notification preferences" />
      <div className="tabs" role="tablist" aria-label="Settings sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} className="tab" onClick={() => select(id)}>
            <Icon aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      <section className="card settings-card" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        <div className="card__body">
          {tab === 'general' && <GeneralTab />}
          {tab === 'profile' && <ProfileTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'notifications' && <NotificationsTab />}
        </div>
      </section>
    </>
  )
}
