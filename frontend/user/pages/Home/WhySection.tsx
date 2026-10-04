import { Building2, Flag, ShieldCheck, Truck } from 'lucide-react'
import { MaskLines } from '../../components/animations/MaskLines'
import { Reveal, RevealGroup, RevealItem } from '../../components/animations/Reveal'
import { FOUNDED_YEAR } from '../../data/company'

const reasons = [
  {
    icon: Truck,
    title: 'Our own resources on the ground',
    text: 'A workforce of 522 and more than 100 owned plant and equipment units, deployed across our Qatar operations.',
  },
  {
    icon: ShieldCheck,
    title: 'ISO certified systems',
    text: 'Quality, environmental and occupational health & safety management certified to ISO 9001, ISO 14001 and ISO 45001, with a ‘Zero Harm’ safety programme.',
  },
  {
    icon: Building2,
    title: 'Government-scale delivery',
    text: 'Major Ashghal programmes, including the QAR 550 million upgrade of the roads surrounding the Lusail Sports Circuit.',
  },
  {
    icon: Flag,
    title: '100% Qatari owned',
    text: `A Qatari contracting company since ${FOUNDED_YEAR}, contributing to Qatar’s sustainable growth and long-term vision.`,
  },
]

/** Reasons to partner with I.H.E., set against an editorial statement column. */
export function WhySection() {
  return (
    <section className="section section--white why" aria-labelledby="why-title">
      <div className="container why__grid">
        <div className="why__intro">
          <Reveal className="section-header__meta">
            <span className="section-header__index mono">04</span>
            <span className="eyebrow">Why I.H.E.</span>
          </Reveal>
          <MaskLines id="why-title" lines={['On time,', 'with quality', 'and safely']} accentLine={2} className="h2" />
          <Reveal delay={0.15}>
            <p className="lead muted why__lead">
              We deliver projects on time, with quality and safely — establishing procedures and implementing quality control to
              achieve the dependability our clients expect, throughout project execution.
            </p>
          </Reveal>
        </div>

        <RevealGroup as="ul" className="why__list" stagger={0.1}>
          {reasons.map(({ icon: Icon, title, text }, i) => (
            <RevealItem as="li" key={title} className="why__item">
              <div className="why__item-top">
                <span className="why__icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.4} />
                </span>
                <span className="mono why__num">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="h4">{title}</h3>
              <p className="muted">{text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
