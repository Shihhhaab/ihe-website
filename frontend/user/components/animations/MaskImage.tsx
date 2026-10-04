import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef, type CSSProperties } from 'react'
import { EASE_IN_OUT, viewport } from '../../lib/motion'
import { Img } from '../ui/Img'
import './animations.css'

interface MaskImageProps {
  /** Bundled image key or uploaded image URL. */
  name: string
  alt: string
  className?: string
  sizes?: string
  /** Direction the clip-path opens from. */
  from?: 'bottom' | 'left' | 'right'
  /** Vertical parallax travel as a percentage of the frame height. */
  parallax?: number
  priority?: boolean
  style?: CSSProperties
}

const closed = {
  bottom: 'inset(100% 0% 0% 0%)',
  left: 'inset(0% 100% 0% 0%)',
  right: 'inset(0% 0% 0% 100%)',
}

/**
 * Image framed by a clip-path that opens on scroll-in, with a slow settle zoom
 * and optional scroll-linked parallax inside the frame.
 */
export function MaskImage({
  name,
  alt,
  className = '',
  sizes,
  from = 'bottom',
  parallax = 8,
  priority,
  style,
}: MaskImageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`-${parallax}%`, `${parallax}%`])

  return (
    <motion.div
      ref={ref}
      className={`mask-image ${reduce || !parallax ? 'mask-image--static' : ''} ${className}`}
      style={style}
      initial={reduce ? false : { clipPath: closed[from] }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={viewport}
      transition={{ duration: 1.25, ease: EASE_IN_OUT }}
    >
      <motion.div className="mask-image__inner" style={reduce || !parallax ? undefined : { y }}>
        <motion.div
          style={{ height: '100%' }}
          initial={reduce ? false : { scale: 1.18 }}
          whileInView={{ scale: 1 }}
          viewport={viewport}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Img name={name} alt={alt} sizes={sizes} priority={priority} />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
