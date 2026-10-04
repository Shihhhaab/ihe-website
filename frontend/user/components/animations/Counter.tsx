import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

interface CounterProps {
  value: number
  duration?: number
  className?: string
}

/** Counts up to `value` once in view. Writes to the DOM directly to avoid re-renders. */
export function Counter({ value, duration = 2, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduce = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node || !inView) return
    if (reduce || value === 0) {
      node.textContent = String(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toString()
      },
    })
    return () => controls.stop()
  }, [inView, value, duration, reduce])

  return (
    <span ref={ref} className={className}>
      {reduce ? value : 0}
    </span>
  )
}
