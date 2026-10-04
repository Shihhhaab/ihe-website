import { MaskImage } from '../../components/animations/MaskImage'
import { MaskLines } from '../../components/animations/MaskLines'
import { Reveal } from '../../components/animations/Reveal'
import { TextLink } from '../../components/buttons/Button'
import { StatsBand } from '../../components/sections/StatsBand'
import { company, FOUNDED_YEAR } from '../../data/company'

/** Who we are: corporate mission statement with a layered image composition. */
export function IntroSection() {
  return (
    <section id="who-we-are" className="section section--white grid-texture intro" aria-labelledby="intro-title">
      <div className="container">
        <div className="intro__grid">
          <div className="intro__copy">
            <Reveal className="section-header__meta">
              <span className="section-header__index mono">01</span>
              <span className="eyebrow">Who we are</span>
            </Reveal>

            <MaskLines
              id="intro-title"
              lines={['A reliable partner', 'in Qatar’s', 'infrastructure', 'development']}
              accentLine={3}
              className="h2 intro__title"
              stagger={0.08}
            />

            <Reveal className="intro__text" delay={0.1}>
              <p className="lead">
                A leading Qatari contracting company established in {FOUNDED_YEAR}, specialising in{' '}
                <strong>Roads &amp; Infrastructure, Earthworks, Drainage Networks and General Contracting Works</strong>.
              </p>
              <p className="muted">
                With a proven track record in delivering major projects, I.H.E. contributes to Qatar’s sustainable growth and
                long-term vision — backed by a workforce of 500+, more than 100 owned plant and equipment units, and ISO
                certified quality, environmental and safety management systems.
              </p>
            </Reveal>

            <Reveal className="intro__sign" delay={0.2}>
              <div>
                <p className="intro__sign-name">{company.owner.name}</p>
                <p className="mono intro__sign-role">{company.owner.title}</p>
              </div>
              <TextLink to="/about">Our story</TextLink>
            </Reveal>
          </div>

          <div className="intro__visual">
            <MaskImage
              name="ihe-landscaped-roads"
              alt="Completed dual carriageway with landscaped verges and a pedestrian park"
              className="intro__img-main"
              sizes="(max-width: 900px) 100vw, 45vw"
            />
            <MaskImage
              name="ihe-material-supply"
              alt="I.H.E. site team in safety gear at an aggregate stockpile"
              className="intro__img-inset"
              sizes="(max-width: 900px) 50vw, 20vw"
              from="left"
              parallax={4}
            />
            <Reveal className="intro__badge" delay={0.4}>
              <span className="mono">Established {FOUNDED_YEAR}</span>
              <strong>100% Qatari owned</strong>
              <span className="mono">CR No. {company.crNumber}</span>
            </Reveal>
            <span className="intro__measure mono" aria-hidden="true">
              <span />
              Est. {FOUNDED_YEAR}
              <span />
            </span>
          </div>
        </div>

        <div className="intro__stats">
          <StatsBand tone="light" />
        </div>
      </div>
    </section>
  )
}
