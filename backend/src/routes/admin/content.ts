import { Router } from 'express'
import { ENQUIRY_STATUS_LABELS, PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '../../../../shared/constants.ts'
import type { ProjectStatus } from '../../../../shared/types.ts'
import {
  slugify,
  validateAdminEnquiry,
  validateBlog,
  validateCertificate,
  validateEnquiryStatus,
  validateHero,
  validateProject,
  validateService,
} from '../../../../shared/validation.ts'
import { requireArea } from '../../auth/session.ts'
import type { Db } from '../../db/database.ts'
import * as repo from '../../db/repositories.ts'
import { badRequest, idParam, notFound, valid } from '../../http/errors.ts'
import { discardReplaced, type MediaStore } from '../../media/storage.ts'

/** Appends -2, -3… until the slug is free. */
async function uniqueSlug(base: string, taken: (slug: string) => Promise<boolean>) {
  const root = base || 'item'
  let slug = root
  for (let n = 2; await taken(slug); n++) slug = `${root}-${n}`
  return slug
}

/* ─── Enquiries ───────────────────────────────────────────── */

export function enquiryRoutes(db: Db) {
  const router = Router()
  const enquiries = repo.enquiries(db)
  const activity = repo.activity(db)
  router.use(requireArea('enquiries'))

  router.get('/', async (_req, res) => {
    res.json(await enquiries.list())
  })

  router.post('/', async (req, res) => {
    const input = valid(validateAdminEnquiry(req.body))
    const id = await enquiries.create(input)
    await activity.log('enquiry', 'Enquiry logged', `${input.name} (${input.company}) — ${input.requirement}.`)
    res.status(201).json(await enquiries.byId(id))
  })

  router.patch('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    const existing = await enquiries.byId(id)
    if (!existing) throw notFound('Enquiry')
    const { status } = valid(validateEnquiryStatus(req.body))
    await enquiries.setStatus(id, status)
    if (status !== existing.status)
      await activity.log('enquiry', 'Enquiry status updated', `${existing.name}'s enquiry marked as ${ENQUIRY_STATUS_LABELS[status]}.`)
    res.json(await enquiries.byId(id))
  })

  router.delete('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    if (!(await enquiries.byId(id))) throw notFound('Enquiry')
    await enquiries.remove(id)
    res.status(204).end()
  })

  return router
}

/* ─── Blogs ───────────────────────────────────────────────── */

export function blogRoutes(db: Db, media: MediaStore | null, log: (err: unknown) => void) {
  const router = Router()
  const blogs = repo.blogs(db)
  const activity = repo.activity(db)
  router.use(requireArea('blogs'))

  router.get('/', async (_req, res) => {
    res.json(await blogs.list())
  })

  router.post('/', async (req, res) => {
    const input = valid(validateBlog(req.body))
    if (await blogs.slugTaken(input.slug)) throw badRequest('Please correct the highlighted fields.', { slug: 'Another post already uses this slug.' })
    const id = await blogs.create(input)
    if (input.featured) await blogs.clearFeatured(id)
    await activity.log('blog', input.status === 'published' ? 'Blog post published' : 'Blog draft created', `"${input.title}"`)
    res.status(201).json(await blogs.byId(id))
  })

  router.put('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    const existing = await blogs.byId(id)
    if (!existing) throw notFound('Blog post')
    const input = valid(validateBlog(req.body))
    if (await blogs.slugTaken(input.slug, id)) throw badRequest('Please correct the highlighted fields.', { slug: 'Another post already uses this slug.' })
    await blogs.update(id, input)
    discardReplaced(media, existing.image, input.image, log)
    if (input.featured) await blogs.clearFeatured(id)
    const published = existing.status !== 'published' && input.status === 'published'
    await activity.log('blog', published ? 'Blog post published' : 'Blog post updated', `"${input.title}"`)
    res.json(await blogs.byId(id))
  })

  router.delete('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    const existing = await blogs.byId(id)
    if (!existing) throw notFound('Blog post')
    await blogs.remove(id)
    discardReplaced(media, existing.image, null, log)
    await activity.log('blog', 'Blog post deleted', `"${existing.title}"`)
    res.status(204).end()
  })

  return router
}

/* ─── Website header ──────────────────────────────────────── */

export function headerRoutes(db: Db, media: MediaStore | null, log: (err: unknown) => void) {
  const router = Router()
  const settings = repo.settings(db)
  const activity = repo.activity(db)
  router.use(requireArea('header'))

  router.get('/', async (_req, res) => {
    res.json(await settings.hero())
  })

  router.put('/', async (req, res) => {
    const input = valid(validateHero(req.body))
    const previous = await settings.hero()
    await settings.setHero(input)
    // Only once the new header is saved is a replaced upload deleted.
    discardReplaced(media, previous?.image, input.image, log)
    await activity.log('settings', 'Website header updated', `"${input.title.join(' ')}" is now the home page header.`)
    res.json(await settings.hero())
  })

  return router
}

/* ─── Projects ────────────────────────────────────────────── */

export function projectRoutes(db: Db, media: MediaStore | null, log: (err: unknown) => void) {
  const router = Router()
  const projects = repo.projects(db)
  const activity = repo.activity(db)
  router.use(requireArea('projects'))

  router.get('/', async (req, res) => {
    const status = req.query.status as ProjectStatus | undefined
    if (status && !PROJECT_STATUSES.includes(status)) throw badRequest('Unknown project status.')
    res.json(await projects.list(status))
  })

  router.post('/', async (req, res) => {
    const input = valid(validateProject(req.body))
    const slug = await uniqueSlug(slugify(input.title), (s) => projects.slugTaken(s))
    const id = await projects.create(slug, input)
    await activity.log('project', 'Project added', `${input.title} added to ${PROJECT_STATUS_LABELS[input.status].toLowerCase()} projects.`)
    res.status(201).json(await projects.byId(id))
  })

  router.put('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    const existing = await projects.byId(id)
    if (!existing) throw notFound('Project')
    const input = valid(validateProject(req.body))
    await projects.update(id, input)
    discardReplaced(media, existing.image, input.image, log)
    const detail =
      existing.status !== input.status
        ? `${input.title} moved to ${PROJECT_STATUS_LABELS[input.status].toLowerCase()} projects.`
        : input.progress !== null && input.progress !== existing.progress
          ? `${input.title} is now ${input.progress}% complete.`
          : `${input.title} details were updated.`
    await activity.log('project', existing.status !== input.status ? 'Project status changed' : 'Project progress updated', detail)
    res.json(await projects.byId(id))
  })

  router.delete('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    const existing = await projects.byId(id)
    if (!existing) throw notFound('Project')
    await projects.remove(id)
    discardReplaced(media, existing.image, null, log)
    await activity.log('project', 'Project removed', `${existing.title} was deleted.`)
    res.status(204).end()
  })

  return router
}

/* ─── Services ────────────────────────────────────────────── */

export function serviceRoutes(db: Db, media: MediaStore | null, log: (err: unknown) => void) {
  const router = Router()
  const services = repo.services(db)
  const activity = repo.activity(db)
  router.use(requireArea('services'))

  router.get('/', async (_req, res) => {
    res.json(await services.list())
  })

  router.post('/', async (req, res) => {
    const input = valid(validateService(req.body))
    const slug = await uniqueSlug(input.slug, (s) => services.slugTaken(s))
    const id = await services.create({ ...input, slug })
    await activity.log('service', 'Service added', `${input.title} was added${input.visible ? ' to the website' : ' (hidden)'}.`)
    res.status(201).json(await services.byId(id))
  })

  router.put('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    const existing = await services.byId(id)
    if (!existing) throw notFound('Service')
    const input = valid(validateService(req.body))
    if (await services.slugTaken(input.slug, id)) throw badRequest('Please correct the highlighted fields.', { slug: 'Another service already uses this anchor.' })
    await services.update(id, input)
    discardReplaced(media, existing.image, input.image, log)
    const detail =
      existing.visible !== input.visible
        ? `${input.title} is now ${input.visible ? 'shown on' : 'hidden from'} the website.`
        : `${input.title} details were updated.`
    await activity.log('service', 'Service updated', detail)
    res.json(await services.byId(id))
  })

  router.delete('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    const existing = await services.byId(id)
    if (!existing) throw notFound('Service')
    await services.remove(id)
    discardReplaced(media, existing.image, null, log)
    await activity.log('service', 'Service removed', `${existing.title} was deleted.`)
    res.status(204).end()
  })

  return router
}

/* ─── Certificates ────────────────────────────────────────── */

export function certificateRoutes(db: Db, media: MediaStore | null, log: (err: unknown) => void) {
  const router = Router()
  const certificates = repo.certificates(db)
  const activity = repo.activity(db)
  router.use(requireArea('certificates'))

  router.get('/', async (_req, res) => {
    res.json(await certificates.list())
  })

  router.post('/', async (req, res) => {
    const input = valid(validateCertificate(req.body))
    const id = await certificates.create(input)
    await activity.log('certificate', 'Certificate added', `${input.title} (${input.issuer}) was added${input.visible ? ' to the About page' : ' (hidden)'}.`)
    res.status(201).json(await certificates.byId(id))
  })

  router.put('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    const existing = await certificates.byId(id)
    if (!existing) throw notFound('Certificate')
    const input = valid(validateCertificate(req.body))
    await certificates.update(id, input)
    discardReplaced(media, existing.file, input.file, log)
    await activity.log('certificate', 'Certificate updated', `${input.title} was updated.`)
    res.json(await certificates.byId(id))
  })

  router.delete('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    const existing = await certificates.byId(id)
    if (!existing) throw notFound('Certificate')
    await certificates.remove(id)
    discardReplaced(media, existing.file, null, log)
    await activity.log('certificate', 'Certificate removed', `${existing.title} was deleted.`)
    res.status(204).end()
  })

  return router
}
