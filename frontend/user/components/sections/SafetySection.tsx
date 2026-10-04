import { ShieldCheck } from 'lucide-react'
import { qhsePolicy } from '../../data/company'
import { DrawLine } from '../animations/DrawLine'
import { Reveal, RevealGroup, RevealItem } from '../animations/Reveal'
import { SectionHeader } from './SectionHeader'
import './sections.css'

/** QHSE policy: the certified management systems and the quality, health & safety and environment commitments. */
export function SafetySection({ index = '06' }: { index?: string }) {
  return (
    <section className="section section--darker grid-texture safety" aria-labelledby="safety-title">
      <div className="container">
        <SectionHeader
          id="safety-title"
          index={index}
          eyebrow="QHSE policy"
          title={['Excellence in', 'every undertaking']}
          accentLine={1}
          intro={qhsePolicy.statement}
        />

        <div className="safety__body">
          <Reveal className="safety__record">
            <ShieldCheck className="safety__icon" size={28} strokeWidth={1.25} aria-hidden="true" />
            <p className="safety__zero">{qhsePolicy.certifications.length}</p>
            <p className="safety__zero-label mono">ISO certified systems</p>
            <ul className="safety__certs muted">
              {qhsePolicy.certifications.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Reveal>

          <RevealGroup as="ol" className="safety__pillars" stagger={0.12}>
            {qhsePolicy.pillars.map((pillar, i) => (
              <RevealItem as="li" key={pillar.title} className="safety__pillar">
                <DrawLine className="safety__rule" delay={i * 0.1} />
                <span className="safety__num mono">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h4">{pillar.title}</h3>
                <ul className="safety__points muted">
                  {pillar.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}
