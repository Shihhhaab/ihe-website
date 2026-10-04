import type { PublicBlogPost } from '../types.ts'

/*
 * Blog content model.
 *
 * The existing I.H.E. website has no published articles, so every post below is
 * placeholder editorial content (flagged with `placeholder: true`). The backend
 * seeds the database from this array; after that, posts are managed in the
 * admin panel and served by the API. The website keeps this array as its
 * offline fallback.
 */

export const seedBlogPosts: PublicBlogPost[] = [
  {
    slug: 'building-the-arteries-of-vision-2030',
    title: 'Building the Arteries of Qatar National Vision 2030',
    excerpt:
      'Why earthworks, materials logistics and heavy fleet capacity sit underneath every headline infrastructure project in the State of Qatar.',
    category: 'Industry',
    date: '2026-09-08',
    readMinutes: 6,
    image: 'doha-skyline',
    imageAlt: 'Doha expressway interchange at dusk with light trails',
    featured: true,
    placeholder: true,
    body: [
      {
        type: 'paragraph',
        text: 'Infrastructure is the foundational framework upon which a nation’s legacy is built. Expressways, interchanges and new districts are the visible result — but every one of them begins with work most people never see: excavation, backfilling, sub-base preparation and the steady movement of millions of tonnes of raw material.',
      },
      { type: 'heading', text: 'The work beneath the surface' },
      {
        type: 'paragraph',
        text: 'Before a single layer of asphalt is laid, a site has to be cleared, excavated, leveled and compacted. Each of those stages depends on having the right machinery on site at the right time, operated by people who understand the tolerances involved.',
      },
      {
        type: 'list',
        items: [
          'Site clearing and bulk excavation to design levels',
          'Delivery of sand, aggregate and sub-base to a planned schedule',
          'Compaction and testing ahead of paving',
          'Asphalt laying, rolling and quality verification',
        ],
      },
      {
        type: 'quote',
        text: 'We don’t just build roads. We build Qatar’s future.',
      },
      { type: 'heading', text: 'Logistics as a critical path' },
      {
        type: 'paragraph',
        text: 'On large programmes, materials logistics is rarely a side activity — it is the critical path. A late delivery of sub-base can idle a paving crew; an unplanned equipment breakdown can hold up an entire section. Reliable fleet dispatch and maintenance discipline are what keep those risks off the programme.',
      },
      {
        type: 'paragraph',
        text: 'This article is placeholder content prepared for the new I.H.E. website and will be replaced with published company news.',
      },
    ],
  },
  {
    slug: 'asphalt-compaction-quality-control',
    title: 'Getting Compaction Right: Quality Control in Asphalt Works',
    excerpt:
      'Thickness, density and compaction ratios decide how long a road lasts. A practical look at the checks that matter on site.',
    category: 'Road Works',
    date: '2026-08-21',
    readMinutes: 5,
    image: 'qatar-highway',
    imageAlt: 'Asphalt road under construction with rollers and crews',
    placeholder: true,
    body: [
      {
        type: 'paragraph',
        text: 'A road surface is only as durable as the layers beneath it and the care taken during compaction. Hot mix asphalt that is placed well but under-compacted will rut, crack and let water in far earlier than designed.',
      },
      { type: 'heading', text: 'What gets measured' },
      {
        type: 'list',
        items: [
          'Layer thickness against design drawings',
          'In-place density and compaction ratio',
          'Surface regularity after final rolling',
          'Sub-base preparation and leveling before paving',
        ],
      },
      {
        type: 'paragraph',
        text: 'Double-drum roller compactors, operated in a disciplined rolling pattern while the mix is still within its temperature window, do most of the work. Testing then confirms what the crew has achieved.',
      },
      {
        type: 'paragraph',
        text: 'This article is placeholder content prepared for the new I.H.E. website and will be replaced with published company news.',
      },
    ],
  },
  {
    slug: 'zero-lti-safety-culture',
    title: 'What a Zero-Accident Culture Looks Like on an Active Site',
    excerpt:
      'Safety policy, assurance, risk management and promotion — the four pillars behind safe heavy equipment operations.',
    category: 'Safety',
    date: '2026-07-30',
    readMinutes: 4,
    image: 'cases-slider-img-3',
    imageAlt: 'Driver completing a pre-start inspection on a heavy truck',
    placeholder: true,
    body: [
      {
        type: 'paragraph',
        text: 'Safety on a heavy equipment site is not a poster on a wall. It is a management commitment, a set of controls that are checked continuously, and a culture that every operator carries onto site each morning.',
      },
      { type: 'heading', text: 'Four pillars' },
      {
        type: 'list',
        items: [
          'Policy — management commitment to execute projects safely',
          'Assurance — continuous evaluation of risk controls on active sites',
          'Risk management — hazard identification and safe operating boundaries',
          'Promotion — on-site training that builds zero-accident habits',
        ],
      },
      {
        type: 'paragraph',
        text: 'This article is placeholder content prepared for the new I.H.E. website and will be replaced with published company news.',
      },
    ],
  },
  {
    slug: 'choosing-heavy-equipment-lease',
    title: 'Short-Term or Long-Term? Choosing the Right Fleet Lease',
    excerpt:
      'How project duration, utilization and operator requirements shape the most cost-effective way to lease heavy machinery.',
    category: 'Fleet',
    date: '2026-07-12',
    readMinutes: 5,
    image: 'qatar-heavy-fleet',
    imageAlt: 'Wheel loaders, excavators and tipper trucks lined up at a fleet yard',
    placeholder: true,
    body: [
      {
        type: 'paragraph',
        text: 'Leasing heavy equipment lets contractors match fleet size to the programme instead of carrying idle assets. The right structure depends on how long the machine is needed and how intensively it will be used.',
      },
      { type: 'heading', text: 'Questions to ask before you lease' },
      {
        type: 'list',
        items: [
          'How many weeks will the machine be fully utilized?',
          'Do you need an experienced operator supplied with the unit?',
          'What maintenance and replacement guarantees are included?',
          'Does the equipment meet local safety standards for your site?',
        ],
      },
      {
        type: 'paragraph',
        text: 'This article is placeholder content prepared for the new I.H.E. website and will be replaced with published company news.',
      },
    ],
  },
  {
    slug: 'materials-logistics-planning',
    title: 'Planning Bulk Materials Logistics for Expressway Projects',
    excerpt:
      'Sand, aggregate and sub-base move in enormous volumes. Scheduling, loading and dispatch make the difference between flow and delay.',
    category: 'Logistics',
    date: '2026-06-24',
    readMinutes: 6,
    image: 'cases-slider-img-2',
    imageAlt: 'Yard coordinator reviewing stock on warehouse racking',
    placeholder: true,
    body: [
      {
        type: 'paragraph',
        text: 'Expressway construction consumes raw materials at a scale that demands planning. Stockpiles, loaders and tipper fleets have to be coordinated so that every paving and backfilling crew is supplied when it needs to be.',
      },
      { type: 'heading', text: 'Keeping materials moving' },
      {
        type: 'paragraph',
        text: 'Integrated dispatch management — knowing where every truck is and what it is carrying — turns a fleet into a dependable supply line rather than a collection of vehicles.',
      },
      {
        type: 'paragraph',
        text: 'This article is placeholder content prepared for the new I.H.E. website and will be replaced with published company news.',
      },
    ],
  },
  {
    slug: 'site-preparation-clearing-to-sub-base',
    title: 'Site Preparation: From Clearing to a Compacted Sub-Base',
    excerpt:
      'Every durable road starts long before paving. The sequence of clearing, excavation, leveling and compaction that sets it up.',
    category: 'Road Works',
    date: '2026-05-18',
    readMinutes: 5,
    image: 'about-img',
    imageAlt: 'Industrial port and logistics terminals at dusk',
    placeholder: true,
    body: [
      {
        type: 'paragraph',
        text: 'Site preparation is where a road’s lifespan is decided. Clearing, bulk excavation and leveling bring the ground to design levels; sub-base material is then placed and compacted to carry the pavement above it.',
      },
      {
        type: 'list',
        items: [
          'Land clearing and removal of unsuitable material',
          'Bulk excavation and soil stabilization',
          'Placement of sand and aggregate sub-base',
          'Compaction and leveling ahead of paving',
        ],
      },
      {
        type: 'paragraph',
        text: 'This article is placeholder content prepared for the new I.H.E. website and will be replaced with published company news.',
      },
    ],
  },
  {
    slug: 'maintenance-discipline-fleet-uptime',
    title: 'Maintenance Discipline and Fleet Uptime',
    excerpt:
      'Regular maintenance logs and replacement guarantees are what keep leased machinery productive on demanding sites.',
    category: 'Fleet',
    date: '2026-06-05',
    readMinutes: 4,
    image: 'promo-2',
    imageAlt: 'Bulldozer and excavators parked at an equipment yard',
    placeholder: true,
    body: [
      {
        type: 'paragraph',
        text: 'In Qatar’s climate, heavy machinery works hard. Heat, dust and long shifts all take their toll, which is why preventive maintenance is not optional for a fleet that clients depend on.',
      },
      {
        type: 'list',
        items: [
          'Scheduled servicing recorded in maintenance logs',
          'Pre-start inspections by operators',
          'Replacement units when a machine is taken out of service',
        ],
      },
      {
        type: 'paragraph',
        text: 'This article is placeholder content prepared for the new I.H.E. website and will be replaced with published company news.',
      },
    ],
  },
]

