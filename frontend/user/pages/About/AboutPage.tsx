import { DrawLine } from '../../components/animations/DrawLine'
import { MaskImage } from '../../components/animations/MaskImage'
import { MaskLines } from '../../components/animations/MaskLines'
import { Reveal, RevealGroup, RevealItem } from '../../components/animations/Reveal'
import { CertificatesSection } from '../../components/sections/CertificatesSection'
import { CtaBand } from '../../components/sections/CtaBand'
import { PageHero } from '../../components/sections/PageHero'
import { SectionHeader } from '../../components/sections/SectionHeader'
import { StatsBand } from '../../components/sections/StatsBand'
import { company, direction, FOUNDED_YEAR, milestones, organization, qualityPrinciples, workforce, WORKFORCE_TOTAL } from '../../data/company'
import { usePageMeta } from '../../hooks/usePageMeta'
import './about.css'

export default function AboutPage() {
  usePageMeta(
    'About',
    'Established in 2008, I.H.E. is a 100% Qatari-owned, ISO certified contractor specialising in roads & infrastructure, earthworks, drainage networks and general contracting.',
  )

  return (
    <div className="page">
      <PageHero
        pageIndex="02 / 06"
        crumb="About"
        eyebrow="About I.H.E."
        title={['Qatari-owned.', 'Built to', 'deliver.']}
        accentLine={2}
        intro={company.description}
        image="ihe-safety-briefing"
        imageAlt="I.H.E. site team at a safety briefing"
      >
        <dl className="hero-meta">
          <div>
            <dt>Founded</dt>
            <dd>{FOUNDED_YEAR}</dd>
          </div>
          <div>
            <dt>Ownership</dt>
            <dd>100% Qatari</dd>
          </div>
          <div>
            <dt>CR No.</dt>
            <dd>{company.crNumber}</dd>
          </div>
        </dl>
      </PageHero>

      {/* Management statement */}
      <section className="section section--white statement" aria-labelledby="statement-title">
        <div className="container statement__grid">
          <div className="statement__visual">
            <MaskImage
              name="ihe-earthworks"
              alt="I.H.E. excavator loading a tipper truck during earthworks"
              className="statement__img"
              sizes="(max-width: 900px) 100vw, 40vw"
            />
            <span className="statement__caption mono">Fig. 01 — Earthworks, State of Qatar</span>
          </div>

          <div className="statement__copy">
            <Reveal className="section-header__meta">
              <span className="section-header__index mono">01</span>
              <span className="eyebrow">Corporate leadership · Management statement</span>
            </Reveal>
            <MaskLines
              id="statement-title"
              as="h2"
              lines={['A reliable partner', 'in Qatar’s infrastructure', 'development']}
              accentLine={2}
              className="h2"
            />
            <Reveal className="statement__text" delay={0.1}>
              <p className="lead">
                Established in {FOUNDED_YEAR} under the ownership and management of <strong>Mr. {company.owner.name}</strong>,{' '}
                {company.legalName} is a 100% Qatari-owned contracting company operating across the State of Qatar.
              </p>
              <p className="muted">
                We specialise in roads & infrastructure, earthworks, drainage networks and general contracting works. With a
                strong workforce, modern equipment and a commitment to Quality, Health, Safety and Environment (QHSE), we deliver
                projects efficiently, safely and to the highest standards.
              </p>
              <blockquote className="statement__quote">
                “Safety is a shared responsibility. We deliver projects on time, with quality and safely.”
              </blockquote>
            </Reveal>
            <Reveal className="statement__sign" delay={0.2}>
              <p className="statement__name">{company.owner.name}</p>
              <p className="mono statement__role">{company.owner.title}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Mission & vision */}
      <section className="section section--light grid-texture purpose" aria-label="Mission and vision">
        <div className="container purpose__grid">
          <Reveal as="article" className="purpose__item">
            <span className="purpose__label mono">02 — Mission</span>
            <p className="purpose__text">{direction.mission.text}</p>
            <ul className="purpose__points">
              {direction.mission.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Reveal>
          <span className="purpose__divider" aria-hidden="true" />
          <Reveal as="article" className="purpose__item" delay={0.15}>
            <span className="purpose__label mono">03 — Vision</span>
            <p className="purpose__text">{direction.vision.text}</p>
            <ul className="purpose__points">
              {direction.vision.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Reveal>
        </div>
        <div className="container purpose__stats">
          <StatsBand />
        </div>
      </section>

      {/* Core values */}
      <section className="section section--white values" aria-labelledby="values-title">
        <div className="container">
          <SectionHeader
            id="values-title"
            index="04"
            eyebrow="Quality management"
            title={['Quality is', 'engineered in']}
            accentLine={1}
            intro="Establishing procedures and implementing quality control to achieve the dependability our clients expect throughout project execution."
          />
          <RevealGroup as="ol" className="values__list" stagger={0.1}>
            {qualityPrinciples.map((value, i) => (
              <RevealItem as="li" key={value.title} className="values__item">
                <span className="values__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="h3">{value.title}</h3>
                  <p className="muted">{value.text}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Milestones */}
      <section className="section section--light milestones" aria-labelledby="milestones-title">
        <div className="container">
          <SectionHeader
            id="milestones-title"
            index="05"
            eyebrow="History"
            title={['Milestones', 'of success']}
            accentLine={1}
          />
          <div className="milestones__track">
            <DrawLine className="milestones__line" />
            <RevealGroup as="ol" className="milestones__list" stagger={0.18}>
              {milestones.map((m) => (
                <RevealItem as="li" key={m.year} className="milestones__item">
                  <span className="milestones__node" aria-hidden="true" />
                  <p className="milestones__year">{m.year}</p>
                  <h3 className="h4">{m.title}</h3>
                  <p className="muted">{m.text}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Organization chart */}
      <section className="section section--white grid-texture org" aria-labelledby="org-title">
        <div className="container">
          <SectionHeader
            id="org-title"
            index="06"
            eyebrow="Corporate tree"
            title={['Organization', 'chart']}
            accentLine={1}
            intro={`A lean structure that connects ownership directly to projects, plant, people and finance — supported by a workforce of ${WORKFORCE_TOTAL}.`}
          />
          <div className="org__chart">
            <Reveal className="org__node org__node--head">
              <span className="mono">{organization.head.role}</span>
              <strong>{organization.head.name}</strong>
            </Reveal>
            <span className="org__stem" aria-hidden="true" />
            <Reveal className="org__node org__node--mgmt" delay={0.1}>
              <strong>{organization.management}</strong>
            </Reveal>
            <span className="org__stem" aria-hidden="true" />
            <RevealGroup as="ul" className="org__departments" stagger={0.1} delay={0.2}>
              {organization.departments.map((d, i) => (
                <RevealItem as="li" key={d.title} className="org__dept">
                  <span className="mono org__dept-num">D{i + 1}</span>
                  <h3 className="h4">{d.title}</h3>
                  <p className="muted">{d.text}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          <div className="org__workforce">
            <Reveal className="org__workforce-head">
              <span className="mono">Manpower</span>
              <strong>{WORKFORCE_TOTAL} total workforce</strong>
            </Reveal>
            <RevealGroup as="dl" className="org__workforce-list" stagger={0.1}>
              {workforce.map((w) => (
                <RevealItem key={w.label} className="org__workforce-item">
                  <dt className="muted">{w.label}</dt>
                  <dd>
                    <strong>{w.value}</strong>
                    <span className="mono">{w.share}</span>
                  </dd>
                  <span className="org__workforce-bar" style={{ width: w.share }} aria-hidden="true" />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      <CtaBand />
      {/* Managed in the admin panel (Certificates); sits directly above the footer. */}
      <CertificatesSection index="07" />
    </div>
  )
}
