import { Check } from 'lucide-react'
import { MaskImage } from '../../components/animations/MaskImage'
import { MaskLines } from '../../components/animations/MaskLines'
import { Reveal, RevealGroup, RevealItem } from '../../components/animations/Reveal'
import { TextLink } from '../../components/buttons/Button'
import { CtaBand } from '../../components/sections/CtaBand'
import { PageHero } from '../../components/sections/PageHero'
import { SafetySection } from '../../components/sections/SafetySection'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useServices } from '../../hooks/usePublicContent'
import './services.css'

export default function ServicesPage() {
  usePageMeta(
    'Services',
    'Roads & infrastructure, earthworks, asphalt & pavement works, buildings works, general contracting and material supply across the State of Qatar.',
  )
  const { data: services } = useServices()
  // Sections after the (admin-managed) list of services continue its numbering.
  const nextIndex = (offset: number) => String(services.length + offset).padStart(2, '0')

  return (
    <div className="page">
      <PageHero
        pageIndex="03 / 06"
        crumb="Services"
        eyebrow="Our services"
        title={['Roads.', 'Earthworks.', 'Contracting.']}
        accentLine={2}
        intro="Six service lines covering the full scope of civil works — from earthworks, drainage and utilities to asphalt paving, buildings and material supply — backed by more than 100 owned plant and equipment units."
        image="ihe-plant-equipment"
        imageAlt="I.H.E. plant and equipment lined up at the company yard"
      >
        <nav className="service-jump" aria-label="Service lines">
          {services.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="service-jump__link">
              <span className="mono">{s.index}</span>
              {s.title}
            </a>
          ))}
        </nav>
      </PageHero>

      <section className="section section--white services-list" aria-label="Service lines">
        <div className="container">
          {services.map((service, i) => (
            <article
              key={service.id}
              id={service.id}
              className={`service-block ${i % 2 === 1 ? 'service-block--flip' : ''}`}
              aria-labelledby={`${service.id}-title`}
            >
              <div className="service-block__media">
                <MaskImage
                  name={service.image}
                  alt={service.imageAlt}
                  className="service-block__img"
                  sizes="(max-width: 900px) 100vw, 55vw"
                  from={i % 2 === 1 ? 'right' : 'left'}
                />
                <span className="service-block__index" aria-hidden="true">
                  {service.index}
                </span>
              </div>

              <div className="service-block__body">
                <Reveal className="service-block__eyebrow mono">
                  Service {service.index} / {String(services.length).padStart(2, '0')}
                </Reveal>
                <MaskLines
                  id={`${service.id}-title`}
                  as="h2"
                  lines={[service.title]}
                  className="h2 service-block__title"
                />
                <Reveal delay={0.1}>
                  <p className="lead muted">{service.description}</p>
                </Reveal>
                <RevealGroup as="ul" className="service-block__bullets" stagger={0.07} delay={0.15}>
                  {service.bullets.map((b) => (
                    <RevealItem as="li" key={b}>
                      <Check size={16} strokeWidth={2} aria-hidden="true" />
                      <span>{b}</span>
                    </RevealItem>
                  ))}
                </RevealGroup>
                <Reveal delay={0.3}>
                  <TextLink to="/contact">Request a quotation</TextLink>
                </Reveal>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--dark grid-texture operations" aria-labelledby="operations-title">
        <div className="container operations__grid">
          <div>
            <Reveal className="section-header__meta">
              <span className="section-header__index mono">{nextIndex(1)}</span>
              <span className="eyebrow">Project delivery</span>
            </Reveal>
            <MaskLines
              id="operations-title"
              lines={['On time,', 'with quality', 'and safely']}
              accentLine={2}
              className="h2"
            />
          </div>
          <Reveal className="operations__text" delay={0.15}>
            <p className="lead">
              Safety is a shared responsibility. We deliver projects on time, with quality and safely.
            </p>
            <p className="muted">
              Our quality management system establishes procedures and quality control throughout project execution, backed by
              ISO 9001, ISO 14001 and ISO 45001 certification.
            </p>
          </Reveal>
        </div>
      </section>

      <SafetySection index={nextIndex(2)} />
      <CtaBand />
    </div>
  )
}
