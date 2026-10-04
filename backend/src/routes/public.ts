import { Router } from 'express'
import { toPublicProject } from '../../../shared/format.ts'
import type { BlogPostRecord, CertificateRecord, PublicBlogPost, PublicCertificate, PublicService, ServiceRecord } from '../../../shared/types.ts'
import { validatePublicEnquiry } from '../../../shared/validation.ts'
import type { Db } from '../db/database.ts'
import * as repo from '../db/repositories.ts'
import { notFound, valid } from '../http/errors.ts'
import { rateLimit } from '../http/security.ts'

/*
 * Read-only content for the public website, plus the contact form endpoint.
 * Responses use the same shapes as the site's bundled fallback content.
 */

const toPublicPost = (p: BlogPostRecord): PublicBlogPost => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  category: p.category,
  date: p.publishDate,
  readMinutes: p.readMinutes,
  image: p.image,
  imageAlt: p.imageAlt,
  featured: p.featured,
  body: p.body,
})

const toPublicService = (s: ServiceRecord, i: number): PublicService => ({
  id: s.slug,
  index: String(i + 1).padStart(2, '0'),
  title: s.title,
  short: s.short,
  description: s.description,
  bullets: s.bullets,
  image: s.image,
  imageAlt: s.imageAlt,
})

const toPublicCertificate = ({ visible: _visible, sortOrder: _order, updatedAt: _updated, ...rest }: CertificateRecord): PublicCertificate => rest

export function publicRoutes(db: Db) {
  const router = Router()

  // Short shared caching keeps the site fast while admin edits appear within a minute.
  router.use((req, res, next) => {
    if (req.method === 'GET') res.setHeader('Cache-Control', 'public, max-age=60')
    next()
  })

  router.get('/blogs', async (_req, res) => {
    res.json((await repo.blogs(db).published()).map(toPublicPost))
  })

  router.get('/blogs/:slug', async (req, res) => {
    const post = (await repo.blogs(db).published()).find((p) => p.slug === req.params.slug)
    if (!post) throw notFound('Article')
    res.json(toPublicPost(post))
  })

  router.get('/projects', async (_req, res) => {
    res.json((await repo.projects(db).published()).map(toPublicProject))
  })

  router.get('/services', async (_req, res) => {
    res.json((await repo.services(db).visible()).map(toPublicService))
  })

  router.get('/certificates', async (_req, res) => {
    res.json((await repo.certificates(db).visible()).map(toPublicCertificate))
  })

  router.post(
    '/enquiries',
    rateLimit({ windowMs: 10 * 60_000, max: 5, message: 'Too many requests. Please try again in a few minutes.' }),
    async (req, res) => {
      // Honeypot: real visitors never fill the hidden "website" field.
      if (typeof req.body?.website === 'string' && req.body.website.trim()) {
        res.status(201).json({ reference: null })
        return
      }
      const input = valid(validatePublicEnquiry(req.body))
      const enquiries = repo.enquiries(db)
      const enquiry = (await enquiries.byId(await enquiries.create({ ...input, source: 'website' })))!
      await repo.activity(db).log('enquiry', 'New enquiry received', `${input.name} submitted "${input.requirement}" through the website.`)
      res.status(201).json({ reference: enquiry.reference })
    },
  )

  return router
}
