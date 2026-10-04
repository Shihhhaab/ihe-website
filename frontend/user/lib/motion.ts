import type { Transition, Variants } from 'motion/react'

// Shared motion language: long, decelerating eases — no bounce.
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1]

export const revealTransition: Transition = { duration: 0.9, ease: EASE_OUT }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: revealTransition },
}

export const staggerContainer = (stagger = 0.09, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
})

export const viewport = { once: true, margin: '0px 0px -12% 0px' } as const
