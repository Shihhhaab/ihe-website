// The home page header as the website shipped it: shown until an admin saves
// their own header, and offered in the admin panel as a starting point.
import type { HeroContent } from '../types.ts'
import { companyProfile } from './company.ts'

export const defaultHero: HeroContent = {
  image: 'ihe-road-intersection',
  imageAlt: 'Aerial view of a signalised road intersection and parking area built by I.H.E.',
  subtitle: 'Roads · Infrastructure · Earthworks · General contracting',
  title: ['Delivering', 'infrastructure', 'excellence in Qatar'],
  description: `A leading Qatari contracting company established in ${companyProfile.foundedYear}, delivering roads, infrastructure, earthworks and drainage networks that support Qatar’s sustainable growth.`,
  ctaLabel: 'Explore our services',
  ctaLink: '/services',
}
