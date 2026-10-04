import { FOUNDED_YEAR } from '../../data/company'

export interface HeroSlide {
  id: string
  /** Bundled image key (see frontend/shared/imageManifest.json). */
  image: string
  imageAlt: string
  /** object-position for the hero photo, tuned per image. */
  focus: string
  eyebrow: string
  /** Headline lines for MaskLines; the last line renders in the accent colour. */
  title: string[]
  text: string
  /** Short label used by the slide dots' accessible name. */
  dotLabel: string
}

/**
 * Home hero carousel. Slide one is the site's original header — image, copy
 * and CTAs unchanged. Slides two and three reuse existing service photography
 * (see shared/content/services.ts) to spotlight another I.H.E. service line.
 */
export const heroSlides: HeroSlide[] = [
  {
    id: 'roads-infrastructure',
    image: 'ihe-road-intersection',
    imageAlt: 'Aerial view of a signalised road intersection and parking area built by I.H.E.',
    focus: '50% 62%',
    eyebrow: 'Roads · Infrastructure · Earthworks · General contracting',
    title: ['Delivering', 'infrastructure', 'excellence in Qatar'],
    text: `A leading Qatari contracting company established in ${FOUNDED_YEAR}, delivering roads, infrastructure, earthworks and drainage networks that support Qatar’s sustainable growth.`,
    dotLabel: 'Roads & Infrastructure',
  },
  {
    id: 'earthworks',
    image: 'ihe-earthworks',
    imageAlt: 'I.H.E. excavator fleet carrying out bulk earthworks and site grading on a Qatar project',
    focus: '50% 68%',
    eyebrow: 'Earthworks · Site grading & bulk excavation',
    title: ['Engineering the', 'ground beneath', 'every project'],
    text: 'Bulk earthworks, advance grading and site preparation carried out with our own excavator and crushing fleet — the foundation every road and building is built on.',
    dotLabel: 'Earthworks',
  },
  {
    id: 'asphalt-pavement',
    image: 'ihe-asphalt-paving',
    imageAlt: 'I.H.E. paving crew laying asphalt with pavers and rollers on a Qatar road project',
    focus: '50% 58%',
    eyebrow: 'Asphalt & Pavement Works · Paving & surfacing',
    title: ['Smooth roads,', 'built to last', 'across Qatar'],
    text: 'Asphalt paving and unbound pavement construction for roads, parking areas and cycle paths, delivered by our own paving crews and compaction equipment.',
    dotLabel: 'Asphalt & Pavement',
  },
]
