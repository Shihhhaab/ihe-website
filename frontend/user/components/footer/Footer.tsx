import { ArrowUp, Mail, MapPin, Phone, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { company, FOUNDED_YEAR } from '../../data/company'
import { primaryNav } from '../../data/navigation'
import { useServices } from '../../hooks/usePublicContent'
import { MaskLines } from '../animations/MaskLines'
import { Reveal } from '../animations/Reveal'
import { Button } from '../buttons/Button'
import { Logo } from '../navigation/Logo'
import { LinkedInIcon } from '../ui/LinkedInIcon'
import './footer.css'

export function Footer() {
  const { data: services } = useServices()
  const year = new Date().getFullYear()
  const scrollToTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <footer className="footer on-dark">
      <div className="container">
        <div className="footer__lead">
          <MaskLines as="p" lines={['Shaping Qatar’s', 'infrastructural', 'horizons.']} accentLine={2} className="footer__statement" />
          <Reveal className="footer__lead-cta" delay={0.2}>
            <p className="muted">Partnerships, project tenders, pre-qualification and material supply enquiries.</p>
            <Button to="/contact">Start a conversation</Button>
          </Reveal>
        </div>

        <div className="footer__grid">
          <div className="footer__brand">
            <Logo />
            <p className="muted">{company.description}</p>
            <a
              className="footer__social"
              href={company.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="I.H.E. on LinkedIn (opens in a new tab)"
            >
              <LinkedInIcon size={16} />
              <span>LinkedIn</span>
            </a>
          </div>

          <nav className="footer__col" aria-label="Footer">
            <h2 className="footer__heading">Discover</h2>
            <ul>
              {primaryNav.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer__col">
            <h2 className="footer__heading">Services</h2>
            <ul>
              {services.map((service) => (
                <li key={service.id}>
                  <Link to={`/services#${service.id}`} className="footer__link">
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <address className="footer__col footer__contact">
            <h2 className="footer__heading">Contact</h2>
            <ul>
              <li>
                <Phone size={16} strokeWidth={1.5} aria-hidden="true" />
                <span>
                  <span className="footer__label">Office tel</span>
                  <a href={company.contact.phoneHref} className="footer__link">
                    {company.contact.phone}
                  </a>
                </span>
              </li>
              <li>
                <Printer size={16} strokeWidth={1.5} aria-hidden="true" />
                <span>
                  <span className="footer__label">Fax line</span>
                  {company.contact.fax}
                </span>
              </li>
              <li>
                <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
                <span>
                  <span className="footer__label">Corporate email</span>
                  <a href={`mailto:${company.contact.email}`} className="footer__link">
                    {company.contact.email}
                  </a>
                </span>
              </li>
              <li>
                <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
                <span>
                  <span className="footer__label">Postal address</span>
                  {company.contact.poBox}
                </span>
              </li>
            </ul>
          </address>
        </div>

        <div className="footer__bottom mono">
          <p>
            © {year} {company.legalName} · CR No. {company.crNumber}. All rights reserved.
          </p>
          <p className="footer__coords" aria-hidden="true">
            25.3203° N · 51.4835° E · Est. {FOUNDED_YEAR}
          </p>
          <button type="button" className="footer__top" onClick={scrollToTop}>
            Back to top
            <ArrowUp size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="footer__watermark" aria-hidden="true">
        I.H.E.
      </p>
    </footer>
  )
}
