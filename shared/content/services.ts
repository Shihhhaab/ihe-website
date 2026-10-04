import type { PublicService } from '../types.ts'

/*
 * Core services from the I.H.E. Company Profile (R26.0, slide 5), each with the
 * photograph the profile pairs with it. Key points are drawn from the scopes of
 * work of I.H.E. projects in the same profile.
 *
 * The backend seeds the database from this list; after that, services are
 * managed in the admin panel (Services). The website keeps it as its offline
 * fallback.
 */
export const seedServices: PublicService[] = [
  {
    id: 'roads-infrastructure',
    index: '01',
    title: 'Roads & Infrastructure',
    short: 'Road corridors and the infrastructure around them — drainage and utility networks, street lighting and vehicle restraint systems.',
    description:
      'Construction and upgrading of roads and their supporting infrastructure for public-sector programmes across Qatar, from road corridors to the drainage, utility and lighting networks that serve them.',
    bullets: [
      'Road works including 64 m, 40 m and 16 m wide corridors',
      'Foul sewer, storm water and Treated Sewage Effluent (TSE) networks',
      'Potable water networks',
      'Street lighting including high masts',
      'Vehicle restraint systems',
    ],
    image: 'ihe-roads-infrastructure',
    imageAlt: 'Newly paved I.H.E. road with paving equipment at work',
  },
  {
    id: 'earthworks',
    index: '02',
    title: 'Earthworks',
    short: 'Site grading, bulk earthworks and crushing for infrastructure and development projects.',
    description:
      'Site grading, bulk earthworks and crushing, carried out with our own plant and equipment for road, infrastructure and development programmes.',
    bullets: [
      'Site grading and bulk earthworks',
      'Advance grading and grading construction packages',
      'Earthworks and crushing',
      'Excavation and site preparation',
    ],
    image: 'ihe-earthworks',
    imageAlt: 'I.H.E. excavators working on an earthworks site',
  },
  {
    id: 'asphalt-pavement',
    index: '03',
    title: 'Asphalt & Pavement Works',
    short: 'Asphalt and unbound pavement for roads, parking areas and cycle paths.',
    description:
      'Asphalt paving and unbound pavement construction for roads, large parking areas and cycle paths, delivered by our own paving crews and equipment.',
    bullets: ['Asphalt works', 'Unbound pavement', 'Parking areas', 'Cycle paths'],
    image: 'ihe-asphalt-paving',
    imageAlt: 'I.H.E. paving crew laying asphalt with a paver and rollers',
  },
  {
    id: 'buildings-works',
    index: '04',
    title: 'Buildings Works',
    short: 'Buildings works delivered alongside our infrastructure portfolio.',
    description: 'Construction of commercial buildings, delivered alongside our infrastructure portfolio.',
    bullets: ['Commercial buildings'],
    image: 'ihe-commercial-building',
    imageAlt: 'Commercial building with ground-floor shops built by I.H.E.',
  },
  {
    id: 'general-contracting',
    index: '05',
    title: 'General Contracting',
    short: 'Multi-discipline contracting — drainage, utilities, landscaping and site works.',
    description:
      'General contracting across the full scope of infrastructure projects, from drainage structures and utility networks to hard and soft landscaping.',
    bullets: [
      'Drainage networks and storm water attenuation tanks',
      'Sewer trunklines by micro-tunnelling',
      'Hardscaping and soft landscaping works',
      'Street furniture and safety furniture',
    ],
    image: 'ihe-utility-networks',
    imageAlt: 'Utility network construction along an I.H.E. road corridor',
  },
  {
    id: 'material-supply',
    index: '06',
    title: 'Material Supply',
    short: 'Supply of quality aggregate, concrete and asphalt for construction projects.',
    description: 'Production and supply of quality aggregate, concrete and asphalt, supporting our own works and construction projects in Qatar.',
    bullets: ['Aggregate', 'Concrete', 'Asphalt', 'Sub-base and sand'],
    image: 'ihe-material-supply',
    imageAlt: 'I.H.E. site team at an aggregate stockpile with a road roller',
  },
]
