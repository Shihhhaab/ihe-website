import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { Button } from '../../components/buttons/Button'
import { MaskLines } from '../../components/animations/MaskLines'
import { Img } from '../../components/ui/Img'
import { imageSource } from '../../data/images'
import { FOUNDED_YEAR } from '../../data/company'
import { EASE_IN_OUT, EASE_OUT } from '../../lib/motion'
import { heroSlides } from './heroSlides'

const heroMeta = [
  { label: 'Established', value: String(FOUNDED_YEAR) },
  { label: 'Ownership', value: '100% Qatari owned' },
  { label: 'Workforce', value: '500+ people' },
]

const AUTOPLAY_MS = 5000

// Slides push the previous one off-screen; direction flips which side they enter/exit from.
const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%' }),
  center: { x: '0%', transition: { duration: 1, ease: EASE_IN_OUT } },
  exit: (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%', transition: { duration: 1, ease: EASE_IN_OUT } }),
}
// Instant, motion-free swap for prefers-reduced-motion.
const reducedSlideVariants = { enter: { x: '0%' }, center: { x: '0%' }, exit: { x: '0%', transition: { duration: 0 } } }

export function HomeHero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  // True until the carousel's first transition away from slide one — keeps the
  // original cinematic reveal (and its original, longer entrance timing) intact
  // on first paint, exactly as the header looked before the carousel existed.
  const introRef = useRef(true)
  const pausedRef = useRef(false)
  const slide = heroSlides[index]

  const goTo = (next: number, dir: number) => {
    introRef.current = false
    setDirection(dir)
    setIndex(next)
  }
  const goNext = () => goTo((index + 1) % heroSlides.length, 1)

  // Auto-advance; restarts (via the `index` dependency) after every manual change too.
  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => {
      if (!pausedRef.current) goNext()
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, reduce])

  const touchX = useRef<number | null>(null)
  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null
  }
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current == null) return
    const delta = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current
    touchX.current = null
    if (Math.abs(delta) < 40) return
    if (delta < 0) goTo((index + 1) % heroSlides.length, 1)
    else goTo((index - 1 + heroSlides.length) % heroSlides.length, -1)
  }

  const isIntro = introRef.current && index === 0
  // Slower, one-off delays on first paint; snappier repeat timing once the carousel rotates.
  const d = isIntro ? { eyebrow: 0.9, title: 1, text: 1.45, actions: 1.6 } : { eyebrow: 0.15, title: 0.3, text: 0.5, actions: 0.65 }

  return (
    <section
      ref={ref}
      className="home-hero on-dark"
      aria-labelledby="home-hero-title"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Photograph: clip reveal + cinematic settle on first paint, then a sliding carousel */}
      <motion.div className="home-hero__media" style={reduce ? undefined : { y: imageY }}>
        <AnimatePresence initial={false} custom={direction}>
          {isIntro ? (
            <motion.div
              key={slide.id}
              className="home-hero__frame"
              initial={reduce ? false : { clipPath: 'inset(14% 18% 14% 18%)', scale: 1.28 }}
              animate={{ clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }}
              exit="exit"
              custom={direction}
              variants={slideVariants}
              transition={{ duration: 2, ease: EASE_IN_OUT }}
            >
              <Img
                name={slide.image}
                alt={slide.imageAlt}
                className="home-hero__img"
                style={{ objectPosition: slide.focus, animationDelay: '2s' }}
                priority
              />
            </motion.div>
          ) : (
            <motion.div
              key={slide.id}
              className="home-hero__frame"
              custom={direction}
              variants={reduce ? reducedSlideVariants : slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <Img
                name={slide.image}
                alt={slide.imageAlt}
                className="home-hero__img"
                style={{ objectPosition: slide.focus, animationDelay: reduce ? '0s' : '0.6s' }}
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {/* Warms the browser cache for the other slides so they never pop in blank mid-transition. */}
      <div className="sr-only" aria-hidden="true">
        {heroSlides
          .filter((s) => s.id !== slide.id)
          .map((s) => (
            <img key={s.id} src={imageSource(s.image).src} alt="" loading="eager" />
          ))}
      </div>
      <div className="home-hero__shade" aria-hidden="true" />

      {/* Engineering grid lines draw in */}
      <div className="home-hero__lines" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={i}
            initial={reduce ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.6, ease: EASE_IN_OUT, delay: 0.6 + i * 0.08 }}
          />
        ))}
      </div>

      <motion.div
        className="home-hero__coords mono"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
      >
        25.3203° N — 51.4835° E · Doha, State of Qatar
      </motion.div>

      <motion.div className="container home-hero__content" style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={reduce ? false : 'enter'}
            animate="center"
            exit="exit"
            variants={{ enter: { opacity: 1 }, center: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.3 } } }}
          >
            <motion.span
              className="eyebrow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: d.eyebrow, ease: EASE_OUT }}
            >
              {slide.eyebrow}
            </motion.span>

            <MaskLines
              as="h1"
              id="home-hero-title"
              lines={slide.title}
              accentLine={2}
              className="home-hero__title"
              immediate
              delay={d.title}
              stagger={0.12}
            />

            <div className="home-hero__row">
              <motion.p
                className="lead home-hero__text"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: d.text, ease: EASE_OUT }}
              >
                {slide.text}
              </motion.p>
              <motion.div
                className="home-hero__actions"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: d.actions, ease: EASE_OUT }}
              >
                <Button to="/services">Explore our services</Button>
                <Button to="/contact" variant="outline">
                  Partner with us
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="container home-hero__dots-row">
        <nav className="home-hero__dots" aria-label="Hero slides">
          {heroSlides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`home-hero__dot${i === index ? ' is-active' : ''}`}
              aria-label={`Show slide ${i + 1} of ${heroSlides.length}: ${s.dotLabel}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => goTo(i, i > index ? 1 : i < index ? -1 : 1)}
            >
              <span className="home-hero__dot-track" aria-hidden="true">
                {i === index && !reduce && <span key={`${s.id}-${index}`} className="home-hero__dot-fill" />}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="home-hero__bar">
        <div className="container home-hero__bar-inner">
          <dl className="home-hero__meta">
            {heroMeta.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.8 + i * 0.1, ease: EASE_OUT }}
              >
                <dt className="mono">{item.label}</dt>
                <dd>{item.value}</dd>
              </motion.div>
            ))}
          </dl>
          <motion.a
            href="#who-we-are"
            className="scroll-cue mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.1 }}
          >
            <span className="scroll-cue__track" aria-hidden="true">
              <span className="scroll-cue__thumb" />
            </span>
            Scroll
          </motion.a>
        </div>
      </div>
    </section>
  )
}
