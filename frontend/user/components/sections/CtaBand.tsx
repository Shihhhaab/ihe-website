import { Phone } from 'lucide-react'
import { company } from '../../data/company'
import { Button } from '../buttons/Button'
import { MaskImage } from '../animations/MaskImage'
import { MaskLines } from '../animations/MaskLines'
import { Reveal } from '../animations/Reveal'
import './sections.css'

/** Closing call-to-action used at the end of most pages. */
export function CtaBand() {
  return (
    <section className="cta on-dark" aria-labelledby="cta-title">
      <MaskImage
        name="project-lusail-circuit-parking"
        alt=""
        className="cta__media"
        parallax={10}
        from="left"
      />
      <div className="cta__shade" aria-hidden="true" />
      <div className="container cta__inner">
        <Reveal>
          <span className="eyebrow">Work with us</span>
        </Reveal>
        <MaskLines
          id="cta-title"
          lines={['A reliable partner', 'in Qatar’s', 'infrastructure']}
          accentLine={2}
          className="h-display cta__title"
        />
        <Reveal className="cta__foot" delay={0.2}>
          <p className="lead muted">
            Roads & infrastructure, earthworks, asphalt & pavement, buildings, general contracting and material supply for
            public and private clients across Qatar.
          </p>
          <div className="cta__actions">
            <Button to="/contact">Get in touch</Button>
            <Button href={company.contact.phoneHref} variant="outline" icon={<Phone size={16} strokeWidth={1.75} />}>
              {company.contact.phone}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
