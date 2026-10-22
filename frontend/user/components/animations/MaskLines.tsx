import { motion, useReducedMotion } from 'motion/react'
import { EASE_OUT, viewport } from '../../lib/motion'
import './animations.css'

interface MaskLinesProps {
  lines: string[]
  as?: 'h1' | 'h2' | 'h3' | 'p'
  className?: string
  delay?: number
  stagger?: number
  /** Animate on mount instead of when scrolled into view (used in heroes). */
  immediate?: boolean
  /** Index of a line to render in the accent colour. */
  accentLine?: number
  /** Reveal text one letter at a time from left to right. */
  backdrop?: boolean
  id?: string
}


/** Headline whose lines slide up from behind a mask, one after another. */
export function MaskLines({
  lines,
  as = 'h2',
  className,
  delay = 0,
  stagger = 0.1,
  immediate = false,
  accentLine,
  backdrop = false,
  id,
}: MaskLinesProps) {
  const Tag = motion[as]
  const reduce = useReducedMotion()
  const trigger = immediate ? { animate: 'visible' } : { whileInView: 'visible', viewport }
  if (backdrop) {
    // Letter-by-letter reveal: each character fades in from left to right.
    const CHAR_STAGGER = 0.035
    return (
      <Tag id={id} className={className} initial={reduce ? false : 'hidden'} {...trigger} aria-label={lines.join(' ')}>
        {lines.map((line, i) => {
          const chars = Array.from(line)
          const lineDelay = delay + i * stagger
          return (
            <span key={i} style={{ display: 'block' }} aria-hidden="true">
              {chars.map((char, ci) => (
                <motion.span
                  key={ci}
                  className="mask-lines__char"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { duration: 0.08, ease: 'linear', delay: lineDelay + ci * CHAR_STAGGER },
                    },
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          )
        })}
      </Tag>
    )
  }

  return (
    <Tag id={id} className={className} initial={reduce ? false : 'hidden'} {...trigger} aria-label={lines.join(' ')}>
      {lines.map((line, i) => (
        <span className="mask-line" key={i} aria-hidden="true">
          <motion.span
            className={i === accentLine ? 'mask-line__inner accent' : 'mask-line__inner'}
            variants={{
              hidden: { y: '110%' },
              visible: { y: '0%', transition: { duration: 1.05, ease: EASE_OUT, delay: delay + i * stagger } },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
