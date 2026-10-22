import express, { Router } from 'express'
import { canAccess, ROLE_LABELS, type Area } from '../../../../shared/constants.ts'
import type { DashboardSummary, SearchResult } from '../../../../shared/types.ts'
import {
  validateCompany,
  validateNotificationPrefs,
  validatePasswordChange,
  validateProfile,
  validateUser,
} from '../../../../shared/validation.ts'
import { hashPassword, verifyPassword } from '../../auth/password.ts'
import { getAuth, requireArea } from '../../auth/session.ts'
import type { Db } from '../../db/database.ts'
import * as repo from '../../db/repositories.ts'
import { badRequest, forbidden, HttpError, idParam, notFound, valid } from '../../http/errors.ts'
import { discardReplaced, MEDIA_FOLDERS, type MediaFolder, type MediaFormat, type MediaStore } from '../../media/storage.ts'

/* ─── Dashboard, search & notifications ───────────────────── */

const in90Days = () => new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10)

function quarterEnd(d = new Date()) {
  const q = Math.floor(d.getUTCMonth() / 3)
  return new Date(Date.UTC(d.getUTCFullYear(), q * 3 + 3, 0)).toISOString().slice(0, 10)
}

export function overviewRoutes(db: Db) {
  const router = Router()

  router.get('/dashboard', async (_req, res) => {
    const { role } = getAuth(res).user
    const showEnquiries = canAccess(role, 'enquiries')
    const [projects, services, certificates, blogs, counts, recent, activity] = await Promise.all([
      repo.projects(db).list(),
      repo.services(db).list(),
      repo.certificates(db).list(),
      repo.blogs(db).list(),
      showEnquiries ? repo.enquiries(db).counts() : { total: 0, thisMonth: 0 },
      showEnquiries ? repo.enquiries(db).recent(5) : [],
      repo.activity(db).recent(12),
    ])
    const today = new Date().toISOString().slice(0, 10)
    const summary: DashboardSummary = {
      enquiries: { ...counts, recent },
      projects: {
        current: projects.filter((p) => p.status === 'current'),
        completed: projects.filter((p) => p.status === 'completed'),
        dueThisQuarter: projects.filter((p) => p.status === 'current' && p.endDate && p.endDate.length === 10 && p.endDate >= today && p.endDate <= quarterEnd()).length,
      },
      services: { total: services.length, hidden: services.filter((s) => !s.visible).length },
      certificates: {
        total: certificates.length,
        // Expiring within 90 days (or already expired).
        expiringSoon: certificates.filter((c) => c.expiryDate && c.expiryDate.length === 10 && c.expiryDate <= in90Days()).length,
      },
      blogs: { total: blogs.length, drafts: blogs.filter((b) => b.status === 'draft').length },
      activity: activity.filter((a) => showEnquiries || a.kind !== 'enquiry').slice(0, 6),
    }
    res.json(summary)
  })

  router.get('/search', async (req, res) => {
    const q = String(req.query.q ?? '').trim().toLowerCase()
    if (q.length < 2) {
      res.json([])
      return
    }
    const { role } = getAuth(res).user
    const has = (...fields: (string | null)[]) => fields.some((f) => f?.toLowerCase().includes(q))
    const results: SearchResult[] = []
    if (canAccess(role, 'enquiries')) {
      for (const e of await repo.enquiries(db).list()) {
        if (has(e.name, e.company, e.requirement, e.email, e.reference))
          results.push({ kind: 'enquiry', id: e.id, title: e.name, subtitle: `${e.reference} · ${e.requirement}`, href: `/enquiries?view=${e.id}` })
      }
    }
    if (canAccess(role, 'projects')) {
      // Pending projects have no admin page, so they are left out of search.
      for (const p of await repo.projects(db).list()) {
        if (p.status !== 'pending' && has(p.title, p.client, p.location)) results.push({ kind: 'project', id: p.id, title: p.title, subtitle: `${p.client} · ${p.location}`, href: `/projects/${p.status}?edit=${p.id}` })
      }
    }
    if (canAccess(role, 'services')) {
      for (const s of await repo.services(db).list()) {
        if (has(s.title, s.short)) results.push({ kind: 'service', id: s.id, title: s.title, subtitle: s.visible ? 'Service · Shown on website' : 'Service · Hidden', href: `/services?edit=${s.id}` })
      }
    }
    if (canAccess(role, 'certificates')) {
      for (const c of await repo.certificates(db).list()) {
        if (has(c.title, c.issuer, c.reference)) results.push({ kind: 'certificate', id: c.id, title: c.title, subtitle: `Certificate · ${c.issuer}`, href: `/certificates?edit=${c.id}` })
      }
    }
    if (canAccess(role, 'blogs')) {
      for (const b of await repo.blogs(db).list()) {
        if (has(b.title, b.category, b.author)) results.push({ kind: 'blog', id: b.id, title: b.title, subtitle: `${b.category} · ${b.status === 'published' ? 'Published' : 'Draft'}`, href: `/blogs?edit=${b.id}` })
      }
    }
    res.json(results.slice(0, 12))
  })

  router.get('/notifications', async (_req, res) => {
    const { role } = getAuth(res).user
    res.json(canAccess(role, 'enquiries') ? (await repo.enquiries(db).byStatus('new')).slice(0, 8) : [])
  })

  return router
}

/* ─── Users (super admins only) ───────────────────────────── */

export function userRoutes(db: Db, media: MediaStore | null, log: (err: unknown) => void) {
  const router = Router()
  const users = repo.users(db)
  const sessions = repo.sessions(db)
  const activity = repo.activity(db)
  router.use(requireArea('users'))

  router.get('/', async (_req, res) => {
    res.json(await users.list())
  })

  router.post('/', async (req, res) => {
    const input = valid(validateUser(req.body, true))
    if (await users.emailTaken(input.email)) throw badRequest('Please correct the highlighted fields.', { email: 'A user with this email already exists.' })
    const id = await users.create(input, await hashPassword(input.password!))
    await activity.log('user', 'New admin user added', `${input.name} was added as ${ROLE_LABELS[input.role]}.`)
    res.status(201).json(await users.byId(id))
  })

  router.put('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    const existing = await users.byId(id)
    if (!existing) throw notFound('User')
    const input = valid(validateUser(req.body, false))
    if (await users.emailTaken(input.email, id)) throw badRequest('Please correct the highlighted fields.', { email: 'A user with this email already exists.' })
    const losesSuperAdmin = existing.role === 'super_admin' && existing.status === 'active' && (input.role !== 'super_admin' || input.status !== 'active')
    if (losesSuperAdmin && (await users.countActiveSuperAdmins(id)) === 0) throw badRequest('There must always be at least one active super admin.')
    await users.update(id, input)
    if (input.password) await users.setPassword(id, await hashPassword(input.password))
    // Access changes take effect immediately: sign the user out everywhere.
    if (input.password || input.status === 'inactive' || input.role !== existing.role) {
      const self = getAuth(res)
      await sessions.removeAllForUser(id, id === self.user.id ? self.sessionId : 0)
    }
    await activity.log('user', 'Admin user updated', `${input.name}'s account was updated.`)
    res.json(await users.byId(id))
  })

  router.delete('/:id', async (req, res) => {
    const id = idParam(req.params.id)
    if (id === getAuth(res).user.id) throw badRequest('You cannot delete your own account.')
    const existing = await users.byId(id)
    if (!existing) throw notFound('User')
    if (existing.role === 'super_admin' && existing.status === 'active' && (await users.countActiveSuperAdmins(id)) === 0)
      throw badRequest('There must always be at least one active super admin.')
    await users.remove(id)
    await sessions.removeAllForUser(id)
    discardReplaced(media, existing.avatarUrl, null, log)
    await activity.log('user', 'Admin user removed', `${existing.name} no longer has dashboard access.`)
    res.status(204).end()
  })

  return router
}

/* ─── Settings ────────────────────────────────────────────── */

export function settingsRoutes(db: Db, media: MediaStore | null, log: (err: unknown) => void) {
  const router = Router()
  const users = repo.users(db)
  const sessions = repo.sessions(db)
  const settings = repo.settings(db)

  router.get('/company', async (_req, res) => {
    res.json(await settings.company())
  })

  router.put('/company', requireArea('company'), async (req, res) => {
    const input = valid(validateCompany(req.body))
    const previous = await settings.company()
    await settings.setCompany(input)
    discardReplaced(media, previous?.logoUrl, input.logoUrl, log)
    await repo.activity(db).log('settings', 'Company details updated', `${getAuth(res).user.name} updated the general settings.`)
    res.json(await settings.company())
  })

  router.put('/profile', async (req, res) => {
    const { user } = getAuth(res)
    const input = valid(validateProfile(req.body))
    if (await users.emailTaken(input.email, user.id)) throw badRequest('Please correct the highlighted fields.', { email: 'Another user already uses this email.' })
    await users.updateProfile(user.id, input)
    discardReplaced(media, user.avatarUrl, input.avatarUrl, log)
    res.json(await users.byId(user.id))
  })

  router.put('/password', async (req, res) => {
    const { user, sessionId } = getAuth(res)
    const input = valid(validatePasswordChange(req.body))
    if (!(await verifyPassword(input.currentPassword, (await users.passwordHash(user.id))!)))
      throw badRequest('Please correct the highlighted fields.', { currentPassword: 'Current password is incorrect.' })
    await users.setPassword(user.id, await hashPassword(input.newPassword))
    await sessions.removeAllForUser(user.id, sessionId)
    res.status(204).end()
  })

  router.get('/sessions', async (_req, res) => {
    const { user, sessionId } = getAuth(res)
    res.json(await sessions.listForUser(user.id, sessionId))
  })

  router.delete('/sessions/:id', async (req, res) => {
    const { user, sessionId } = getAuth(res)
    const id = idParam(req.params.id)
    if (id === sessionId) throw badRequest('Use "Sign out" to end your current session.')
    await sessions.removeForUser(user.id, id)
    res.status(204).end()
  })

  router.get('/notifications', async (_req, res) => {
    res.json(await users.notificationPrefs(getAuth(res).user.id))
  })

  router.put('/notifications', async (req, res) => {
    const prefs = valid(validateNotificationPrefs(req.body))
    await users.setNotificationPrefs(getAuth(res).user.id, prefs)
    res.json(prefs)
  })

  return router
}

/* ─── Image uploads ───────────────────────────────────────── */

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
/** Certificate scans are often multi-page PDFs, so they get a higher limit. */
const MAX_PDF_BYTES = 8 * 1024 * 1024

/** Detects the file type from its magic bytes rather than trusting the client. */
function sniffFile(buf: Buffer): MediaFormat | null {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (buf.length > 5 && buf.toString('ascii', 0, 5) === '%PDF-') return 'pdf'
  return null
}

/** Which admin area may upload into each folder. `null` = any signed-in admin (their own avatar). */
const FOLDER_AREA: Record<MediaFolder, Area | null> = {
  blogs: 'blogs',
  hero: 'header',
  projects: 'projects',
  services: 'services',
  certificates: 'certificates',
  branding: 'company',
  avatars: null,
}

export function uploadRoutes(media: MediaStore | null, log: (err: unknown) => void) {
  const router = Router()

  // Files arrive base64-encoded inside JSON, so this route accepts a larger body.
  router.post('/', express.json({ limit: '12mb' }), async (req, res) => {
    if (!media) throw new HttpError(503, 'Uploads are not configured. Add the Cloudinary settings to .env.')
    const folder = req.body?.folder as MediaFolder
    if (!MEDIA_FOLDERS.includes(folder)) throw badRequest('Unknown upload folder.')
    const area = FOLDER_AREA[folder]
    if (area && !canAccess(getAuth(res).user.role, area)) throw forbidden()

    const allowPdf = folder === 'certificates'
    const kinds = allowPdf ? 'a PNG, JPG, WebP image or a PDF' : 'a PNG, JPG or WebP image'
    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : ''
    const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/)
    if (!match) throw badRequest(`Upload ${kinds}.`)
    const buf = Buffer.from(match[2], 'base64')
    const format = sniffFile(buf)
    if (!format || (format === 'pdf' && !allowPdf)) throw badRequest(`Upload ${kinds}.`)
    if (buf.length > (format === 'pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES))
      throw new HttpError(413, format === 'pdf' ? 'PDFs must be 8 MB or smaller.' : 'Images must be 4 MB or smaller.')

    try {
      res.status(201).json({ url: await media.upload(buf, folder, format) })
    } catch (err) {
      log(err)
      throw new HttpError(502, 'The file could not be uploaded to Cloudinary. Please try again.')
    }
  })

  return router
}
