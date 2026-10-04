import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE_IN_OUT } from '../../lib/motion'
import './page-transition.css'

const DURATION = 0.65
const SHOWN = 'inset(0% 0% 0% 0%)'

/**
 * Wraps each route. On leave, a navy panel wipes up over the page; on enter,
 * the panel lifts away to reveal the new page. The panel is dark, so there is
 * never a white flash between routes.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()

  if (reduce) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        {children}
      </motion.div>
    )
  }

  return (
    <>
      {children}
      <motion.div
        aria-hidden="true"
        className="page-curtain"
        initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
        animate={{ clipPath: 'inset(100% 0% 0% 0%)' }}
        exit={{ clipPath: SHOWN }}
        transition={{ duration: DURATION, ease: EASE_IN_OUT }}
      >
        <span className="page-curtain__mark" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="page-curtain"
        initial={{ clipPath: SHOWN }}
        animate={{ clipPath: 'inset(0% 0% 100% 0%)' }}
        exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
        transition={{ duration: DURATION, ease: EASE_IN_OUT, delay: 0.1 }}
      >
        <span className="page-curtain__mark" />
      </motion.div>
    </>
  )
}
