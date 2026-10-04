// Company facts, from the I.H.E. Company Profile (R26.0). Where the profile is
// silent (e.g. the owner, map location, LinkedIn), details come from the
// previous I.H.E. website.
import { companyProfile } from '../../../shared/content/company'

export const FOUNDED_YEAR = companyProfile.foundedYear
export const WORKFORCE_TOTAL = companyProfile.workforce.total

export const company = {
  name: companyProfile.name,
  legalName: companyProfile.legalName,
  shortName: 'I.H.E.',
  tagline: 'Transport & Contracting',
  description:
    'A 100% Qatari-owned contracting company established in 2008, specialising in roads & infrastructure, earthworks, drainage networks and general contracting works across the State of Qatar.',
  owner: {
    name: 'Mohammad Kawari',
    title: 'Owner & General Manager',
  },
  crNumber: companyProfile.crNumber,
  contact: {
    phone: companyProfile.phone,
    phoneHref: companyProfile.phoneHref,
    fax: companyProfile.fax,
    email: companyProfile.email,
    poBox: companyProfile.poBox,
    address: companyProfile.address,
    city: 'Doha, State of Qatar',
  },
  location: {
    lat: 25.32031732670262,
    lng: 51.48348757552283,
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3606.520264273752!2d51.48348757552283!3d25.32031732670262!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x666060894ef88ff7%3A0xc3d78331ef68d2b3!2sIHE%20(INTERNATIONAL%20HEAVY%20EQUIPMENT)!5e0!3m2!1sen!2sin!4v1783352556605!5m2!1sen!2sin',
    mapLink: 'https://share.google/1yHXcOnFLbaY6KTKR',
  },
  social: {
    linkedin: 'https://qa.linkedin.com/company/ihe-qa',
  },
} as const

export const yearsInOperation = () => new Date().getFullYear() - FOUNDED_YEAR

export interface Stat {
  value: number
  suffix?: string
  label: string
  note?: string
}

export const stats: Stat[] = [
  { value: yearsInOperation(), suffix: 'Yrs', label: 'Delivering infrastructure in Qatar', note: `Established ${FOUNDED_YEAR}` },
  { value: 500, suffix: '+', label: 'Total workforce', note: `${companyProfile.workforce.total} people` },
  { value: companyProfile.plantAndEquipmentUnits, suffix: '+', label: 'Owned plant & equipment units', note: 'Deployed on our own works' },
  { value: 3, label: 'ISO certified management systems', note: 'ISO 9001 · 14001 · 45001' },
]

export const partners = [
  'Ashghal (Public Works Authority)',
  'Qatar Railways Company',
  'Ministry of Municipality & Environment',
  'HBK Contracting',
  'Midmac Contracting',
  'Al Balagh Trading & Contracting',
  'UCC Holding',
]

/** QHSE policy (Company Profile, slide 8). */
export const qhsePolicy = {
  statement:
    'International Heavy Equipment Transport & Contracting is committed to providing excellence in all its undertakings and ensuring a valuable contribution to quality of life wherever the company operates — delivering total client satisfaction through teamwork, quality excellence and continual improvement.',
  pillars: [
    {
      title: 'Quality',
      points: [
        '100% customer satisfaction through quality service and products',
        'Delivered at reasonable cost, within customer-specified delivery times',
        'Strong relationships with interested parties and improved business processes',
      ],
    },
    {
      title: 'Health & Safety',
      points: [
        'Safety management system certified to ISO 45001',
        'Compliance with all applicable health and safety legislation',
        '‘Zero Harm’ programme preventing major incidents',
      ],
    },
    {
      title: 'Environment',
      points: [
        'Business conducted with respect and care for the environment',
        'No compromise on the health and safety of people or society',
        'QHSE awareness promoted among internal and external stakeholders',
      ],
    },
  ],
  certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'],
}

/** Vision & mission (Company Profile, slide 4). */
export const direction = {
  vision: {
    text: 'To perform high quality work, to be a role model in the sector and a reliable contractor in the industry.',
    points: [
      'Incorporate quality and innovation into the field',
      'Work with employees gathered with team spirit',
      'Set future-oriented goals and work hard to achieve them',
    ],
  },
  mission: {
    text: 'To construct secure and comfortable roads that can be used safely, exceeding the expected life of the product.',
    points: [
      'Produce the best quality aggregate, concrete and asphalt in the industry',
      'Achieve success in the projects undertaken',
      'Use our knowledge and experience for the success of our clients',
    ],
  },
}

/** Quality management principles (Company Profile, slide 6). */
export const qualityPrinciples = [
  { title: 'Quality control', text: 'Established procedures and implemented quality control across execution.' },
  { title: 'Dependability', text: 'Delivering the dependability desired by the client on every project.' },
  { title: 'Cost & schedule', text: 'Quality directly affects project cost and programme performance.' },
  { title: 'Operational reliability', text: 'Sustaining the ongoing operational reliability of the facilities.' },
]

/** Manpower (Company Profile, slide 21). */
export const workforce = [
  { label: 'General workforce', value: companyProfile.workforce.general },
  { label: 'Professional & technical personnel', value: companyProfile.workforce.professional },
  { label: 'Administrative personnel', value: companyProfile.workforce.administrative },
].map((w) => ({ ...w, share: `${((w.value / companyProfile.workforce.total) * 100).toFixed(1)}%` }))

export const milestones = [
  {
    year: '2008',
    title: 'Company Inception',
    text: 'Established by Mr. Mohammad Kawari to meet the growing civil construction and logistics demands of the State of Qatar.',
  },
  {
    year: '2014',
    title: 'Fleet & Asphalt Expansion',
    text: 'Acquired large logistics tippers and paving fleets, expanding into asphalt road works and bulk materials supply.',
  },
  {
    year: 'Present',
    title: 'ISO Certified Contractor',
    text: 'Certified to ISO 9001, ISO 14001 and ISO 45001, and delivering major Ashghal programmes including the roads surrounding the Lusail Sports Circuit.',
  },
]

export const organization = {
  head: { role: 'Owner & Manager', name: 'Mr. Mohammad Kawari' },
  management: 'General Management',
  departments: [
    { title: 'Projects & Engineering', text: 'Site supervision, road design, asphalt laying operations' },
    { title: 'Plant & Equipment', text: 'Deployment and maintenance of 100+ owned plant & equipment units' },
    { title: 'HR & Administration', text: 'Manpower allocation, site safety officers, labor management' },
    { title: 'Finance & Accounts', text: 'Procurement, billing, project cost estimations' },
  ],
}

// Contact form subjects are shared with the admin panel and backend.
export { ENQUIRY_TYPES as enquiryTypes } from '../../../shared/constants'
