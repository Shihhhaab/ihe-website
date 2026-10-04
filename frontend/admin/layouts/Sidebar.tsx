import { ChevronsLeft } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { navSections } from './navigation'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onNavigate: () => void
}

export function Sidebar({ collapsed, onToggleCollapse, onNavigate }: SidebarProps) {
  const { can } = useAuth()
  const sections = navSections
    .map((s) => ({ ...s, items: s.items.filter((i) => i.area === null || can(i.area)) }))
    .filter((s) => s.items.length)

  return (
    <aside className="sidebar" id="admin-sidebar" aria-label="Admin navigation">
      <div className="sidebar__brand">
        <img className="brand-tile" src="/img/ihe-logo.png" alt="" width={184} height={136} />
        <span className="brand-name hide-collapsed">
          I.H.E. <span>ADMIN</span>
        </span>
      </div>

      <nav className="sidebar__nav">
        {sections.map((section) => (
          <div className="sidebar__section" key={section.label}>
            <p className="sidebar__label">{section.label}</p>
            <ul>
              {section.items.map(({ label, to, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} end={to === '/'} className="nav-item" onClick={onNavigate} title={collapsed ? label : undefined}>
                    <Icon aria-hidden="true" />
                    <span className="hide-collapsed">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar__foot">
        <button type="button" className="collapse-btn" onClick={onToggleCollapse} aria-expanded={!collapsed} aria-controls="admin-sidebar">
          <ChevronsLeft size={16} aria-hidden="true" />
          <span className="hide-collapsed">{collapsed ? 'Expand menu' : 'Collapse menu'}</span>
        </button>
      </div>
    </aside>
  )
}
