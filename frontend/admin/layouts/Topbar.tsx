import {
  Award,
  Bell,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  HardHat,
  LogOut,
  Menu,
  MessageSquareText,
  Newspaper,
  Search,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROLE_LABELS } from '../../../shared/constants'
import type { Enquiry, SearchResult } from '../../../shared/types'
import { api } from '../../shared/api'
import { useAuth, useCurrentUser } from '../auth/AuthContext'
import { Avatar } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { useDismiss } from '../hooks/useDismiss'
import { relativeTime } from '../lib/format'

const RESULT_ICONS = { enquiry: MessageSquareText, project: HardHat, service: ClipboardList, certificate: Award, blog: Newspaper }

function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const close = useCallback(() => setResults(null), [])
  // Results only show while there's a searchable query (2+ characters).
  const open = results !== null && query.trim().length >= 2
  useDismiss(ref, open, close)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      api<SearchResult[]>(`/admin/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => {
          setResults(r)
          setActive(0)
        })
        .catch(() => {})
    }, 200)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const go = (r: SearchResult) => {
    setQuery('')
    setResults(null)
    navigate(r.href)
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || !results?.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(results[active])
    }
  }

  return (
    <div className="topbar__search" ref={ref}>
      <label className="search">
        <Search aria-hidden="true" />
        <span className="sr-only">Search enquiries, projects, services, certificates and blogs</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder="Search enquiries, projects, services…"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
      </label>
      {open && results && (
        <div className="popover popover--left popover--wide" id="search-results" role="listbox">
          {results.length === 0 ? (
            <p className="popover__empty">No matches for “{query.trim()}”</p>
          ) : (
            results.map((r, i) => {
              const Icon = RESULT_ICONS[r.kind]
              return (
                <button
                  key={`${r.kind}-${r.id}`}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={`result ${i === active ? 'is-active' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                >
                  <span className="result__icon">
                    <Icon />
                  </span>
                  <span>
                    <span className="result__title">{r.title}</span>
                    <span className="result__sub">{r.subtitle}</span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function Notifications() {
  const { can } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)
  const { data, reload } = useApi<Enquiry[]>(can('enquiries') ? '/admin/notifications' : null)

  // Refresh on navigation and every minute so new website enquiries show up.
  useEffect(() => {
    reload()
    const timer = window.setInterval(reload, 60_000)
    return () => window.clearInterval(timer)
  }, [pathname, reload])

  if (!can('enquiries')) return null
  const count = data?.length ?? 0

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button type="button" className="icon-btn" aria-label={`Notifications: ${count} new ${count === 1 ? 'enquiry' : 'enquiries'}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Bell />
        {count > 0 && <span className="icon-btn__count">{count > 9 ? '9+' : count}</span>}
      </button>
      {open && (
        <div className="popover popover--wide">
          <div className="popover__head">
            <p className="popover__title">New enquiries</p>
          </div>
          {count === 0 ? (
            <p className="popover__empty">You’re all caught up.</p>
          ) : (
            data!.map((e) => (
              <button
                key={e.id}
                type="button"
                className="result"
                onClick={() => {
                  setOpen(false)
                  navigate(`/enquiries?view=${e.id}`)
                }}
              >
                <span className="result__icon">
                  <MessageSquareText />
                </span>
                <span>
                  <span className="result__title">{e.name}</span>
                  <span className="result__sub">
                    {e.requirement} · {relativeTime(e.createdAt)}
                  </span>
                </span>
              </button>
            ))
          )}
          <div className="menu-sep" />
          <button
            type="button"
            className="menu-item"
            onClick={() => {
              setOpen(false)
              navigate('/enquiries')
            }}
          >
            View all enquiries
          </button>
        </div>
      )}
    </div>
  )
}

function ProfileMenu() {
  const user = useCurrentUser()
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button type="button" className="profile-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Avatar name={user.name} src={user.avatarUrl} />
        <span className="profile-btn__text">
          <span className="profile-btn__name">{user.name}</span>
          <span className="profile-btn__role">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open && (
        <div className="popover" role="menu">
          <div className="popover__head">
            <p className="popover__title">{user.name}</p>
            <p className="result__sub">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            className="menu-item"
            onClick={() => {
              setOpen(false)
              navigate('/settings?tab=profile')
            }}
          >
            <UserRound /> My profile
          </button>
          <div className="menu-sep" />
          <button type="button" role="menuitem" className="menu-item menu-item--danger" onClick={() => signOut()}>
            <LogOut /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar__menu" onClick={onOpenMenu} aria-label="Open navigation" aria-controls="admin-sidebar">
        <Menu />
      </button>
      <GlobalSearch />
      <div className="topbar__actions">
        <a className="btn btn--secondary" href="/" target="_blank" rel="noopener noreferrer" aria-label="View website (opens in a new tab)">
          <ExternalLink />
          <span className="view-site-label">View Website</span>
        </a>
        <Notifications />
        <span className="topbar__divider" aria-hidden="true" />
        <ProfileMenu />
      </div>
    </header>
  )
}
