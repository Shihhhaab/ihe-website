import { motion } from 'motion/react'
import { EASE_IN_OUT, viewport } from '../../lib/motion'
import './animations.css'

/** Hairline rule that draws itself from left to right when scrolled into view. */
export function DrawLine({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`draw-line ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={viewport}
      transition={{ duration: 1.4, ease: EASE_IN_OUT, delay }}
    />
  )
}
