import { ArrowUpRight, FileText } from 'lucide-react'
import type { PublicCertificate } from '../../../../shared/types'
import { fullUrl } from '../../../shared/images'
import { useCertificates } from '../../hooks/usePublicContent'
import { RevealGroup, RevealItem } from '../animations/Reveal'
import { Img } from '../ui/Img'
import { SectionHeader } from './SectionHeader'
import './certificates.css'

const formatDate = (iso: string) =>
  new Date(`${iso.length === 4 ? `${iso}-01-01` : iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

function CertificateCard({ certificate, index }: { certificate: PublicCertificate; index: number }) {
  const { title, issuer, reference, issueDate, expiryDate, description, file, fileType } = certificate
  return (
    <a className="certificate" href={fullUrl(file)} target="_blank" rel="noopener noreferrer">
      <span className="certificate__frame">
        <Img name={file} alt={`${title} certificate`} sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" />
        <span className="certificate__index mono" aria-hidden="true">
          C—{String(index + 1).padStart(2, '0')}
        </span>
        {fileType === 'pdf' && (
          <span className="certificate__type mono">
            <FileText size={12} aria-hidden="true" /> PDF
          </span>
        )}
      </span>
      <span className="certificate__body">
        <span className="certificate__issuer mono">{issuer}</span>
        <span className="certificate__title">{title}</span>
        {description && <span className="certificate__desc">{description}</span>}
        <span className="certificate__meta mono">
          {reference && <span>No. {reference}</span>}
          {issueDate && <span>Issued {formatDate(issueDate)}</span>}
          {expiryDate && <span>Valid until {formatDate(expiryDate)}</span>}
        </span>
        <span className="certificate__more">
          View certificate <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </span>
      </span>
    </a>
  )
}

/**
 * Certificates managed in the admin panel (Certificates). Renders nothing
 * until at least one certificate is published, so the page never shows an
 * empty section.
 */
export function CertificatesSection({ index }: { index: string }) {
  const { data: certificates } = useCertificates()
  if (!certificates.length) return null

  return (
    <section className="section section--light certificates" aria-labelledby="certificates-title">
      <div className="container">
        <SectionHeader
          id="certificates-title"
          index={index}
          eyebrow="Accreditations"
          title={['Certificates &', 'accreditations']}
          accentLine={1}
          intro="Independently issued certificates covering our quality, safety and operating standards. Select a certificate to view the full document."
        />
        <RevealGroup as="ul" className="certificates__grid" stagger={0.1}>
          {certificates.map((c, i) => (
            <RevealItem as="li" key={c.id}>
              <CertificateCard certificate={c} index={i} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
