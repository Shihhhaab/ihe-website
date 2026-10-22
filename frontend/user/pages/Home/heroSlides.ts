import { defaultHero } from '../../../../shared/content/hero'
import type { HeroContent } from '../../../../shared/types'

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
 * and CTAs unchanged (see shared/content/hero.ts); admins can replace it from
 * the "Website Header" page. Slides two and three reuse existing service
 * photography (see shared/content/services.ts) to spotlight another I.H.E. service line.
 */
export const heroSlides: HeroSlide[] = [
  {
    id: 'roads-infrastructure',
    image: defaultHero.image!,
    imageAlt: defaultHero.imageAlt,
    focus: '50% 62%',
    eyebrow: defaultHero.subtitle,
    title: defaultHero.title,
    text: defaultHero.description,
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

/** Slide one with the header saved in the admin panel. A removed image falls back to the default photograph. */
export function withSavedHeader(slides: HeroSlide[], hero: HeroContent | null): HeroSlide[] {
  if (!hero) return slides
  const [first, ...rest] = slides
  const ownImage = hero.image !== null && hero.image !== first.image
  return [
    {
      ...first,
      image: hero.image ?? first.image,
      imageAlt: hero.image ? hero.imageAlt : first.imageAlt,
      // The default photo's crop is tuned by hand; other photos are centred.
      focus: ownImage ? '50% 50%' : first.focus,
      eyebrow: hero.subtitle,
      title: hero.title,
      text: hero.description,
      dotLabel: hero.title.join(' '),
    },
    ...rest,
  ]
}
