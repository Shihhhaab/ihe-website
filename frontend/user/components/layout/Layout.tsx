import { AnimatePresence } from 'motion/react'
import { Suspense, useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { PageTransition } from '../animations/PageTransition'
import { Footer } from '../footer/Footer'
import { Header } from '../navigation/Header'

const PAGE_ENTER_DELAY = 650

function scrollToHash(hash: string) {
  const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
  if (!target) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

export function Layout() {
  const location = useLocation()
  const outlet = useOutlet()

  // Honour in-page anchors (e.g. /services#road-asphalt) once the new page has settled.
  useEffect(() => {
    if (!location.hash) return
    const timer = window.setTimeout(() => scrollToHash(location.hash), PAGE_ENTER_DELAY)
    return () => window.clearTimeout(timer)
  }, [location.key, location.hash])

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
          <PageTransition key={location.pathname}>
            <Suspense fallback={<div className="page page--loading" />}>{outlet}</Suspense>
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  )
}
