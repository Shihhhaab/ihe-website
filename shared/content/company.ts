// Core company facts from the I.H.E. Company Profile (R26.0) and the company's
// ISO certificates. Used by the public site and as the initial value of the
// admin "General" settings.
export const companyProfile = {
  name: 'International Heavy Equipment',
  legalName: 'International Heavy Equipment Transport and Contracting W.L.L.',
  tagline: 'Delivering Infrastructure Excellence in Qatar',
  foundedYear: 2008,
  ownership: '100% Qatari owned',
  crNumber: '39377',
  industry: 'Infrastructure & General Contracting',
  certificationScope: 'Construction of Roads & General Contracting',
  email: 'info@ihe-qa.com',
  phone: '+974 441 72987',
  phoneHref: 'tel:+97444172987',
  fax: '+974 441 72988',
  poBox: 'PO Box 200505 – Doha, Qatar',
  /** Registered office, as printed on the company's ISO certificates. */
  address: 'Building No. 385, Street No. 244, Zone No. 34, Madina Khalifa South, Street Jasim Bin Ahmed, Doha, Qatar',
  website: 'ihe-qa.com',
  workforce: { total: 522, general: 425, professional: 82, administrative: 15 },
  plantAndEquipmentUnits: 100,
} as const
