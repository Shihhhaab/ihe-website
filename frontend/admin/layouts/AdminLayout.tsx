import { ShieldAlert } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Area } from '../../../shared/constants'
import { useAuth } from '../auth/AuthContext'
import { EmptyState } from '../components/ui'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const COLLAPSE_KEY = 'ihe-admin-sidebar-collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

/** Sidebar + top bar shell for every signed-in page. Redirects to sign-in when there is no session. */
export function AdminLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* storage unavailable */
    }
  }, [collapsed])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  if (user === undefined) return <Splash />
  if (user === null) {
    const next = location.pathname + location.search
    return <Navigate to={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} replace />
  }

  return (
    <div className={`shell ${collapsed ? 'is-collapsed' : ''} ${drawerOpen ? 'is-drawer-open' : ''}`}>
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} onNavigate={() => setDrawerOpen(false)} />
      <div className="sidebar-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      <div className="shell__main">
        <Topbar onOpenMenu={() => setDrawerOpen(true)} />
        <main className="page" id="main" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/** Blocks a page for roles that can't access its area (the API enforces this too). */
export function RequireArea({ area, children }: { area: Area; children: ReactNode }) {
  const { can } = useAuth()
  if (!can(area))
    return <EmptyState icon={ShieldAlert} title="You don’t have access to this section" text="Ask a super admin if you need permission to manage this area." />
  return <>{children}</>
}

export function Splash() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--charcoal)' }} aria-busy="true" aria-label="Loading">
      <img className="brand-tile" src="/img/ihe-logo.png" alt="" width={184} height={136} style={{ width: 48, height: 48 }} />
    </div>
  )
}
