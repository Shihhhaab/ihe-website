import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useCallback, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { primaryNav } from '../../data/navigation'
import { Button } from '../buttons/Button'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'
import './header.css'

const SOLID_AFTER = 24
const HIDE_AFTER = 480
/** Pages that open with a full-bleed photograph, where the transparent header shows light text. */
const PHOTO_HERO_ROUTES = new Set(['/', '/about', '/services', '/projects', '/blogs'])

/**
 * Fixed header: transparent over a photo hero, solid white with blur once scrolled.
 * Slides away while scrolling down and returns on scroll up.
 */
export function Header() {
  const { scrollY } = useScroll()
  const { pathname } = useLocation()
  const [solid, setSolid] = useState(false)
  const [hidden, setHidden] = useState(false)
  // The menu remembers the route it was opened on, so any navigation closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const menuOpen = menuPath === pathname
  // Charcoal text whenever the header isn't over a photograph.
  const light = solid || menuOpen || !PHOTO_HERO_ROUTES.has(pathname)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const previous = scrollY.getPrevious() ?? 0
    setSolid(y > SOLID_AFTER)
    setHidden(y > HIDE_AFTER && y > previous && !menuOpen)
  })

  const closeMenu = useCallback(() => setMenuPath(null), [])

  return (
    <>
      <motion.header
        className={`site-header ${solid ? 'is-solid' : ''} ${light ? 'is-light' : ''} ${menuOpen ? 'is-menu-open' : ''}`}
        animate={{ y: hidden && !menuOpen ? '-100%' : '0%' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="container site-header__inner">
          <Logo />

          <nav className="site-nav" aria-label="Primary">
            <ul className="site-nav__list">
              {primaryNav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.to === '/'} className="site-nav__link">
                    {({ isActive }) => (
                      <>
                        <span className="site-nav__label">{item.label}</span>
                        {isActive && (
                          <motion.span
                            layoutId="nav-indicator"
                            className="site-nav__indicator"
                            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-header__actions">
            <Button to="/contact" className="site-header__cta">
              Partner with us
            </Button>
            <button
              type="button"
              className={`burger ${menuOpen ? 'is-open' : ''}`}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuPath(menuOpen ? null : pathname)}
            >
              <span className="burger__line" />
              <span className="burger__line" />
              <span className="burger__line" />
            </button>
          </div>
        </div>
        <span className="site-header__rule" aria-hidden="true" />
      </motion.header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  )
}
