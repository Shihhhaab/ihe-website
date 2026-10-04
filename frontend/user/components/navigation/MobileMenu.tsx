import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { company } from '../../data/company'
import { primaryNav } from '../../data/navigation'
import { EASE_IN_OUT, EASE_OUT } from '../../lib/motion'
import { Button } from '../buttons/Button'
import './header.css'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

/** Full-screen navigation for tablet and mobile with staggered links. */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    document.body.classList.add('is-locked')
    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('a')?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      // Keep keyboard focus inside the open menu.
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>('a, button')
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('is-locked')
      window.removeEventListener('keydown', onKey)
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          ref={panelRef}
          className="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.55, ease: EASE_IN_OUT, delay: 0.1 } }}
          transition={{ duration: 0.7, ease: EASE_IN_OUT }}
        >
          <nav aria-label="Mobile" className="container mobile-menu__nav">
            <ul>
              {primaryNav.map((item, i) => (
                <li key={item.to} className="mobile-menu__row">
                  <motion.div
                    initial={{ y: '105%' }}
                    animate={{ y: '0%', transition: { duration: 0.8, ease: EASE_OUT, delay: 0.25 + i * 0.06 } }}
                    exit={{ y: '105%', transition: { duration: 0.35, ease: EASE_IN_OUT } }}
                  >
                    <NavLink to={item.to} end={item.to === '/'} className="mobile-menu__link" onClick={onClose}>
                      <span className="mobile-menu__num mono">{String(i + 1).padStart(2, '0')}</span>
                      {item.label}
                    </NavLink>
                  </motion.div>
                </li>
              ))}
            </ul>
          </nav>

          <motion.div
            className="container mobile-menu__foot"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.7 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <div className="mobile-menu__contact mono">
              <a href={company.contact.phoneHref}>{company.contact.phone}</a>
              <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>
            </div>
            <Button to="/contact">Partner with us</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
