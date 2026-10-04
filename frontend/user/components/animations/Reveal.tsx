import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { fadeUp, staggerContainer, viewport } from '../../lib/motion'

type Tag = 'div' | 'section' | 'ul' | 'ol' | 'li' | 'dl' | 'article' | 'header' | 'p' | 'span' | 'h2' | 'h3'

interface RevealProps extends HTMLMotionProps<'div'> {
  as?: Tag
  delay?: number
  children?: ReactNode
}

/** Fades and lifts its content once, when it scrolls into view. */
export function Reveal({ as = 'div', delay = 0, children, ...rest }: RevealProps) {
  const Component = motion[as] as typeof motion.div
  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={fadeUp}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </Component>
  )
}

interface RevealGroupProps extends HTMLMotionProps<'div'> {
  as?: Tag
  stagger?: number
  delay?: number
  children?: ReactNode
}

/** Staggers the reveal of its direct `RevealItem` children. */
export function RevealGroup({ as = 'div', stagger = 0.09, delay = 0, children, ...rest }: RevealGroupProps) {
  const Component = motion[as] as typeof motion.div
  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={staggerContainer(stagger, delay)}
      {...rest}
    >
      {children}
    </Component>
  )
}

export function RevealItem({ as = 'div', children, ...rest }: Omit<RevealProps, 'delay'>) {
  const Component = motion[as] as typeof motion.div
  return (
    <Component variants={fadeUp} {...rest}>
      {children}
    </Component>
  )
}
