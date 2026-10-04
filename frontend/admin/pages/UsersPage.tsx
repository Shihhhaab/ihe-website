import { Pencil, ShieldCheck, Trash2, UserCheck, UserPlus, Users, UserX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PASSWORD_MIN } from '../../../shared/validation'
import { ROLE_LABELS, ROLES } from '../../../shared/constants'
import type { AdminUser, Role, UserStatus } from '../../../shared/types'
import { api, ApiError } from '../../shared/api'
import { useAuth, useCurrentUser } from '../auth/AuthContext'
import { ConfirmDialog, Dialog } from '../components/Modal'
import { RowMenu } from '../components/RowMenu'
import { useToast } from '../components/Toast'
import { Field } from '../components/form'
import { Avatar, EmptyState, ErrorNotice, PageHeader, SearchBox, StatGrid, TableSkeleton, UserBadge } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { useForm } from '../hooks/useForm'
import './pages.css'

const ROLE_HELP: Record<Role, string> = {
  super_admin: 'Full access, including users and company settings.',
  content_manager: 'Blogs, certificates, projects and services.',
  enquiry_manager: 'Enquiries only.',
}

function UserEditor({ user, onClose, onSaved }: { user: AdminUser | null; onClose: () => void; onSaved: (u: AdminUser) => void }) {
  const { values, set, errors, submitting, submit } = useForm({
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: (user?.role ?? 'content_manager') as Role,
    status: (user?.status ?? 'active') as UserStatus,
    password: '',
  })
  const notify = useToast()

  return (
    <Dialog
      title={user ? 'Edit Admin User' : 'Add Admin User'}
      subtitle={user ? user.email : 'Give a colleague access to the dashboard'}
      size="md"
      onClose={onClose}
      onSubmit={async (e) => {
        e.preventDefault()
        const result: { saved?: AdminUser } = {}
        const ok = await submit(async (v) => {
          result.saved = await api<AdminUser>(user ? `/admin/users/${user.id}` : '/admin/users', { method: user ? 'PUT' : 'POST', body: v })
        })
        if (ok && result.saved) {
          notify(user ? 'User updated' : 'User added')
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
            Save User
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Full Name" required error={errors.name} className="span-2">
          {(a) => <input {...a} className="input" autoComplete="off" value={values.name} onChange={(e) => set('name', e.target.value)} />}
        </Field>
        <Field label="Email" required error={errors.email} className="span-2">
          {(a) => <input {...a} className="input" type="email" autoComplete="off" value={values.email} onChange={(e) => set('email', e.target.value)} placeholder="name@ihe-qa.com" />}
        </Field>
        <Field label="Role" error={errors.role} hint={ROLE_HELP[values.role]}>
          {(a) => (
            <select {...a} className="select" value={values.role} onChange={(e) => set('role', e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Status" error={errors.status}>
          {(a) => (
            <select {...a} className="select" value={values.status} onChange={(e) => set('status', e.target.value as UserStatus)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          )}
        </Field>
        <Field
          label={user ? 'Reset password' : 'Temporary password'}
          required={!user}
          error={errors.password}
          className="span-2"
          hint={user ? 'Leave blank to keep the current password. Resetting signs the user out everywhere.' : `At least ${PASSWORD_MIN} characters with letters and numbers. Share it securely; they can change it in Settings.`}
        >
          {(a) => <input {...a} className="input" type="password" autoComplete="new-password" value={values.password} onChange={(e) => set('password', e.target.value)} />}
        </Field>
      </div>
    </Dialog>
  )
}

export default function UsersPage() {
  const me = useCurrentUser()
  const { setUser } = useAuth()
  const { data, error, loading, reload } = useApi<AdminUser[]>('/admin/users')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null)
  const [deleting, setDeleting] = useState<AdminUser | null>(null)
  const notify = useToast()

  const all = useMemo(() => data ?? [], [data])
  const q = query.trim().toLowerCase()
  const filtered = all.filter((u) => !q || [u.name, u.email, ROLE_LABELS[u.role]].some((f) => f.toLowerCase().includes(q)))

  const setStatus = async (u: AdminUser, status: UserStatus) => {
    try {
      await api(`/admin/users/${u.id}`, { method: 'PUT', body: { ...u, status } })
      notify(status === 'active' ? `${u.name} reactivated` : `${u.name} deactivated`)
      reload()
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not update the user.', 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage admin accounts and their access to the dashboard"
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
            <UserPlus /> Add User
          </button>
        }
      />

      <StatGrid
        loading={loading}
        stats={[
          { label: 'Total Users', value: all.length, icon: Users, tone: 'navy' },
          { label: 'Active', value: all.filter((u) => u.status === 'active').length, icon: UserCheck, tone: 'green' },
          { label: 'Super Admins', value: all.filter((u) => u.role === 'super_admin').length, icon: ShieldCheck, tone: 'red' },
        ]}
      />

      <section className="card" aria-label="Admin users">
        <div className="toolbar">
          <SearchBox label="Search users" placeholder="Search by name, email or role…" value={query} onChange={setQuery} />
        </div>
        {error && (
          <div style={{ padding: '0 24px' }}>
            <ErrorNotice message={error.message} onRetry={reload} />
          </div>
        )}
        {loading ? (
          <TableSkeleton cols={5} rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No users match your search" />
        ) : (
          <div className="table-wrap" style={{ paddingBottom: 16 }}>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last Login</th>
                  <th scope="col" className="col-action">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="cell-media" style={{ minWidth: 220 }}>
                        <Avatar name={u.name} src={u.avatarUrl} />
                        <div style={{ minWidth: 0 }}>
                          <span className="cell-title">
                            {u.name}
                            {u.id === me.id && <span className="muted" style={{ fontWeight: 500 }}> (you)</span>}
                          </span>
                          <span className="cell-sub">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="pill">{ROLE_LABELS[u.role]}</span>
                    </td>
                    <td>
                      <UserBadge status={u.status} />
                    </td>
                    <td className="nowrap">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'short', hour12: false }) : 'Never'}</td>
                    <td className="col-action">
                      <RowMenu
                        label={`Actions for ${u.name}`}
                        actions={[
                          { label: 'Edit', icon: Pencil, onSelect: () => setEditing(u) },
                          { label: 'Deactivate', icon: UserX, onSelect: () => setStatus(u, 'inactive'), hidden: u.status === 'inactive' || u.id === me.id },
                          { label: 'Reactivate', icon: UserCheck, onSelect: () => setStatus(u, 'active'), hidden: u.status === 'active' },
                          { label: 'Delete', icon: Trash2, onSelect: () => setDeleting(u), danger: true, hidden: u.id === me.id },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <UserEditor
          user={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null)
            if (saved.id === me.id) setUser(saved)
            reload()
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete user?"
          message={`${deleting.name} will immediately lose access to the dashboard. This cannot be undone.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/users/${deleting.id}`, { method: 'DELETE' })
              notify('User deleted')
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
