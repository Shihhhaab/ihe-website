import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ImageName } from '../../data/images'
import { EASE_OUT } from '../../lib/motion'
import { MaskLines } from '../animations/MaskLines'
import { Img } from '../ui/Img'
import './sections.css'

interface PageHeroProps {
  eyebrow: string
  title: string[]
  accentLine?: number
  intro: string
  image: ImageName
  imageAlt: string
  pageIndex: string
  crumb: string
  children?: ReactNode
}

/** Cinematic interior-page hero: slow-settling photograph, masked headline, breadcrumb rail. */
export function PageHero({ eyebrow, title, accentLine, intro, image, imageAlt, pageIndex, crumb, children }: PageHeroProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.35])

  return (
    <section ref={ref} className="page-hero on-dark">
      <motion.div className="page-hero__media" style={reduce ? undefined : { y }}>
        <motion.div
          className="page-hero__zoom"
          initial={reduce ? false : { scale: 1.16 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.6, ease: EASE_OUT }}
        >
          <Img name={image} alt={imageAlt} priority />
        </motion.div>
      </motion.div>
      <div className="page-hero__shade" aria-hidden="true" />
      <div className="page-hero__grid" aria-hidden="true" />

      <motion.div className="container page-hero__content" style={reduce ? undefined : { opacity: fade }}>
        <motion.nav
          aria-label="Breadcrumb"
          className="page-hero__crumbs mono"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE_OUT }}
        >
          <Link to="/">I.H.E.</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{crumb}</span>
          <span className="page-hero__index">{pageIndex}</span>
        </motion.nav>

        <motion.span
          className="eyebrow"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: EASE_OUT }}
        >
          {eyebrow}
        </motion.span>
        <MaskLines as="h1" lines={title} accentLine={accentLine} className="page-hero__title" immediate delay={0.6} />

        <div className="page-hero__foot">
          <motion.p
            className="lead page-hero__intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.95, ease: EASE_OUT }}
          >
            {intro}
          </motion.p>
          {children && (
            <motion.div
              className="page-hero__extra"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.1, ease: EASE_OUT }}
            >
              {children}
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  )
}
