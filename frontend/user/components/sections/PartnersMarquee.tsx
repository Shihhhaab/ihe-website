import { partners } from '../../data/company'
import { Reveal } from '../animations/Reveal'
import './sections.css'

/** Continuous ticker of government clients and partners. Pauses on hover; static for reduced motion. */
export function PartnersMarquee() {
  return (
    <section className="partners" aria-labelledby="partners-title">
      <div className="container partners__head">
        <Reveal>
          <h2 id="partners-title" className="eyebrow">
            Trusted partners & government clients
          </h2>
        </Reveal>
      </div>
      <div className="partners__track-wrap">
        <ul className="partners__track">
          {[...partners, ...partners].map((name, i) => (
            <li key={i} className="partners__item" aria-hidden={i >= partners.length || undefined}>
              <span className="partners__dot" aria-hidden="true" />
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
