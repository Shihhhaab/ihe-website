import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, Mail, Mailbox, MapPin, Phone, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MaskLines } from '../../components/animations/MaskLines'
import { Reveal, RevealGroup, RevealItem } from '../../components/animations/Reveal'
import { Img } from '../../components/ui/Img'
import { LinkedInIcon } from '../../components/ui/LinkedInIcon'
import { company } from '../../data/company'
import { usePageMeta } from '../../hooks/usePageMeta'
import { EASE_IN_OUT, EASE_OUT } from '../../lib/motion'
import { ContactForm } from './ContactForm'
import './contact.css'

const channels = [
  { icon: Phone, label: 'Office telephone', value: company.contact.phone, href: company.contact.phoneHref },
  { icon: Printer, label: 'Fax line', value: company.contact.fax },
  { icon: Mail, label: 'Corporate email', value: company.contact.email, href: `mailto:${company.contact.email}` },
  { icon: MapPin, label: 'Office address', value: company.contact.address },
  { icon: Mailbox, label: 'P.O. Box address', value: company.contact.poBox },
]

export default function ContactPage() {
  usePageMeta(
    'Contact',
    `Contact I.H.E. for roads & infrastructure, earthworks, general contracting and material supply enquiries. Tel ${company.contact.phone} · ${company.contact.email} · Doha, Qatar.`,
  )
  const reduce = useReducedMotion()

  return (
    <div className="page">
      {/* Split hero */}
      <section className="contact-hero on-dark" aria-labelledby="contact-title">
        <div className="container contact-hero__grid">
          <div className="contact-hero__copy">
            <nav aria-label="Breadcrumb" className="page-hero__crumbs mono contact-hero__crumbs">
              <Link to="/">I.H.E.</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Contact</span>
              <span className="page-hero__index">06 / 06</span>
            </nav>
            <motion.span
              className="eyebrow"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.55, ease: EASE_OUT }}
            >
              Contact us
            </motion.span>
            <MaskLines
              as="h1"
              id="contact-title"
              lines={['Let’s discuss', 'your next', 'project']}
              accentLine={2}
              className="contact-hero__title"
              immediate
              delay={0.6}
            />
            <motion.p
              className="lead contact-hero__intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.95, ease: EASE_OUT }}
            >
              Get in touch regarding your infrastructure project. We are available for partnerships, project tenders,
              pre-qualification requests and material supply enquiries in the State of Qatar.
            </motion.p>
            <motion.div
              className="contact-hero__quick"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.1, ease: EASE_OUT }}
            >
              <a href={company.contact.phoneHref}>
                <span className="mono">Call</span>
                {company.contact.phone}
              </a>
              <a href={`mailto:${company.contact.email}`}>
                <span className="mono">Write</span>
                {company.contact.email}
              </a>
            </motion.div>
          </div>

          <motion.div
            className="contact-hero__visual"
            initial={reduce ? false : { clipPath: 'inset(0% 0% 0% 100%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            transition={{ duration: 1.4, ease: EASE_IN_OUT, delay: 0.3 }}
          >
            <motion.div
              className="contact-hero__img"
              initial={reduce ? false : { scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ duration: 2.4, ease: EASE_OUT, delay: 0.3 }}
            >
              <Img name="ihe-landscaping-works" alt="Completed I.H.E. road with landscaping works" sizes="(max-width: 900px) 100vw, 45vw" priority />
            </motion.div>
            <span className="contact-hero__stamp mono" aria-hidden="true">
              <span>Response</span>
              <strong>24h</strong>
              <span>Formal quotes</span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Channels + form */}
      <section className="section section--light contact-main" aria-label="Contact details and enquiry form">
        <div className="container contact-main__grid">
          <div className="contact-info">
            <Reveal className="section-header__meta">
              <span className="section-header__index mono">01</span>
              <span className="eyebrow">Direct channels</span>
            </Reveal>
            <MaskLines lines={['Office', 'coordinates']} accentLine={1} className="h2" />
            <RevealGroup as="ul" className="channels" stagger={0.08} delay={0.1}>
              {channels.map(({ icon: Icon, label, value, href }) => {
                const inner = (
                  <>
                    <span className="channels__icon" aria-hidden="true">
                      <Icon size={20} strokeWidth={1.4} />
                    </span>
                    <span className="channels__text">
                      <span className="mono channels__label">{label}</span>
                      <span className="channels__value">{value}</span>
                    </span>
                    {href && <ArrowUpRight className="channels__go" size={18} strokeWidth={1.5} aria-hidden="true" />}
                  </>
                )
                return (
                  <RevealItem as="li" key={label}>
                    {href ? (
                      <a href={href} className="channels__item channels__item--link">
                        {inner}
                      </a>
                    ) : (
                      <div className="channels__item">{inner}</div>
                    )}
                  </RevealItem>
                )
              })}
              <RevealItem as="li">
                <a
                  href={company.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="channels__item channels__item--link"
                >
                  <span className="channels__icon" aria-hidden="true">
                    <LinkedInIcon size={18} />
                  </span>
                  <span className="channels__text">
                    <span className="mono channels__label">Follow</span>
                    <span className="channels__value">LinkedIn — ihe-qa</span>
                  </span>
                  <ArrowUpRight className="channels__go" size={18} strokeWidth={1.5} aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </RevealItem>
            </RevealGroup>
          </div>

          <Reveal className="contact-main__form" delay={0.15}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* Location */}
      <section className="location on-dark" aria-labelledby="location-title">
        <div className="location__map">
          <div className="location__fallback" aria-hidden="true">
            <span className="location__pin" />
          </div>
          <iframe
            src={company.location.mapEmbed}
            title="Map showing the I.H.E. office location in Doha"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <div className="container location__overlay">
          <Reveal className="location__card">
            <span className="eyebrow">Location</span>
            <h2 id="location-title" className="h3">
              Doha, State of Qatar
            </h2>
            <dl className="location__facts">
              <div>
                <dt className="mono">Postal</dt>
                <dd>{company.contact.poBox}</dd>
              </div>
              <div>
                <dt className="mono">Coordinates</dt>
                <dd className="mono">
                  {company.location.lat.toFixed(4)}° N, {company.location.lng.toFixed(4)}° E
                </dd>
              </div>
            </dl>
            <a href={company.location.mapLink} target="_blank" rel="noopener noreferrer" className="text-link">
              <span>Open in Google Maps</span>
              <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
