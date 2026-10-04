/*
 * ISO certificates from the I.H.E. Company Profile (R26.0, slide 7) and the
 * certificate scans it contains. Certified by Delano Assessment Private
 * Limited (DAPL); scope: Construction of Roads & General Contracting (IAF Code 28).
 *
 * Seeded into the database once; afterwards they are managed in the admin
 * panel (Certificates) and shown on the About page. `file` is a bundled image
 * key — upload a higher-resolution scan in the admin panel to replace it.
 */
export interface SeedCertificate {
  title: string
  issuer: string
  reference: string
  issueDate: string
  expiryDate: string
  description: string
  file: string
}

const ISSUER = 'Delano Assessment Private Limited (DAPL)'
const SCOPE = 'Scope: Construction of Roads & General Contracting (IAF Code 28).'

export const seedCertificates: SeedCertificate[] = [
  {
    title: 'ISO 9001:2015 — Quality Management System',
    issuer: ISSUER,
    reference: 'DAPL/QMS/EDG1032',
    issueDate: '2025-04-18',
    expiryDate: '2028-04-17',
    description: SCOPE,
    file: 'iso-9001-certificate',
  },
  {
    title: 'ISO 14001:2015 — Environmental Management System',
    issuer: ISSUER,
    reference: 'DAPL/EMS/EDG1012',
    issueDate: '2025-04-18',
    expiryDate: '2028-04-17',
    description: SCOPE,
    file: 'iso-14001-certificate',
  },
  {
    title: 'ISO 45001:2018 — Occupational Health & Safety Management System',
    issuer: ISSUER,
    reference: 'DAPL/OH&S/EDG1012',
    issueDate: '2025-04-18',
    expiryDate: '2028-04-17',
    description: SCOPE,
    file: 'iso-45001-certificate',
  },
]
