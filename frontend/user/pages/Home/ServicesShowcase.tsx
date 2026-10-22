import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RevealGroup, RevealItem } from '../../components/animations/Reveal'
import { TextLink } from '../../components/buttons/Button'
import { SectionHeader } from '../../components/sections/SectionHeader'
import { Img } from '../../components/ui/Img'
import { useServices } from '../../hooks/usePublicContent'
import { EASE_IN_OUT } from '../../lib/motion'

/** Interactive service index: hovering or focusing a row swaps the preview photograph. */
export function ServicesShowcase() {
  const { data: services } = useServices()
  const [active, setActive] = useState(0)
  // Services are managed in the admin panel, so the list can shrink while this page is open.
  const current = services[Math.min(active, services.length - 1)]
  if (!current) return null

  return (
    <section className="section section--light grid-texture showcase" aria-labelledby="showcase-title">
      <div className="container">
        <SectionHeader
          id="showcase-title"
          index="02"
          eyebrow="Capabilities"
          title={['Core', 'operations']}
          accentLine={1}
          intro="Roads & infrastructure, earthworks, asphalt & pavement, buildings, general contracting and material supply — delivered by our own workforce and plant across the State of Qatar."
          aside={<TextLink to="/services">All services</TextLink>}
        />

        <div className="showcase__grid">
          <RevealGroup as="ol" className="showcase__list" stagger={0.08}>
            {services.map((service, i) => (
              <RevealItem as="li" key={service.id}>
                <Link
                  to={`/services#${service.id}`}
                  className={`showcase__row ${i === active ? 'is-active' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                >
                  <span className="showcase__num mono">{service.index}</span>
                  <span className="showcase__main">
                    <span className="showcase__title">{service.title}</span>
                    <span className="showcase__desc">
                      <span>{service.short}</span>
                    </span>
                  </span>
                  <span className="showcase__arrow" aria-hidden="true">
                    <ArrowUpRight size={22} strokeWidth={1.5} />
                  </span>
                  <span className="showcase__thumb" aria-hidden="true">
                    <Img name={service.image} alt="" sizes="100vw" />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>

          <div className="showcase__preview" aria-hidden="true">
            <AnimatePresence initial={false}>
              <motion.div
                key={current.id}
                className="showcase__preview-frame"
                initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
                animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                exit={{ opacity: 0, transition: { duration: 0.6, delay: 0.3 } }}
                transition={{ duration: 0.9, ease: EASE_IN_OUT }}
              >
                <motion.div
                  className="showcase__preview-img"
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Img name={current.image} alt="" sizes="40vw" />
                </motion.div>
              </motion.div>
            </AnimatePresence>
            <div className="showcase__caption mono">
              <span>
                {current.index} / {String(services.length).padStart(2, '0')}
              </span>
              <span>{current.title}</span>
            </div>
            <span className="showcase__corner showcase__corner--tl" />
            <span className="showcase__corner showcase__corner--br" />
          </div>
        </div>
      </div>
    </section>
  )
}
