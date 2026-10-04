/*
 * API integration tests: the real Express app against a throwaway database,
 * seeded with the website's content. Your real MONGODB_URI database is never used.
 *
 *   npm test                                  → in-memory MongoDB (mongodb-memory-server)
 *   TEST_MONGODB_URI=mongodb+srv://… npm test → a temporary `ihe_test_<timestamp>` database
 *                                               on that server, dropped afterwards
 */
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, before, describe, test } from 'node:test'
import { createApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import { connectDatabase } from '../src/db/database.ts'
import { runMigrations } from '../src/db/migrations.ts'
import { seed } from '../src/db/seed.ts'
import type { MediaFolder, MediaStore } from '../src/media/storage.ts'

const ADMIN = { email: 'owner@example.com', password: 'CorrectHorse42' }

/** Stands in for Cloudinary: records uploads and deletions without any network calls. */
const uploaded: string[] = []
const removed: string[] = []
const media: MediaStore & { removed: string[] } = {
  removed,
  async upload(_image: Buffer, folder: MediaFolder, format: string) {
    const url = `https://res.cloudinary.com/test-cloud/image/upload/v1/ihe/${folder}/${uploaded.length + 1}.${format}`
    uploaded.push(url)
    return url
  },
  async remove(url: string) {
    removed.push(url)
  },
}

async function testMongo() {
  const external = process.env.TEST_MONGODB_URI
  if (external) return { uri: external, stop: async () => {} }
  // Loaded lazily: it downloads a MongoDB binary on first use.
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const mongo = await MongoMemoryServer.create()
  return { uri: mongo.getUri(), stop: async () => void (await mongo.stop()) }
}

async function startServer() {
  const mongo = await testMongo()
  const scratch = mkdtempSync(path.join(tmpdir(), 'ihe-test-'))
  const config = loadConfig({
    env: 'test',
    mongoUri: mongo.uri,
    mongoDbName: `ihe_test_${Date.now()}`,
    cloudinary: null,
    distDir: path.join(scratch, 'no-dist'),
    initialAdmin: { name: 'Owner', ...ADMIN },
  })
  const { client, db } = await connectDatabase(config.mongoUri, config.mongoDbName)
  await runMigrations(db)
  await seed(db, config, () => {})
  const server = createApp(db, config, () => {}, media).listen(0)
  await new Promise((r) => server.once('listening', r))
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  return {
    base,
    close: async () => {
      await new Promise((r) => server.close(r))
      await db.dropDatabase()
      await client.close()
      await mongo.stop()
      rmSync(scratch, { recursive: true, force: true })
    },
  }
}

/** Minimal client that keeps the session cookie between requests. */
function client(base: string) {
  let cookie = ''
  return async (method: string, url: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await fetch(base + url, {
      method,
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) cookie = setCookie.split(';')[0]
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers }
  }
}

let server: Awaited<ReturnType<typeof startServer>>
before(async () => {
  server = await startServer()
})
after(() => server.close())

describe('public website API', () => {
  test('serves the seeded website content', async () => {
    const api = client(server.base)
    const projects = await api('GET', '/api/public/projects')
    assert.equal(projects.status, 200)
    assert.equal(projects.body.length, 15, 'key projects and case studies from the company profile')
    assert.equal(projects.body[0].id, 'lusail-sports-circuit-roads', 'featured project first')
    assert.equal(projects.body[0].value, 'QAR 550M')
    assert.equal(projects.body[0].status, 'Ongoing')
    const riw = projects.body.find((p: { id: string }) => p.id === 'riw-northern-areas-phase-5')
    assert.equal(riw.period, '2024')
    assert.equal(riw.value, 'QAR 340M')

    const blogs = await api('GET', '/api/public/blogs')
    assert.equal(blogs.body.length, 7)
    const post = await api('GET', `/api/public/blogs/${blogs.body[0].slug}`)
    assert.equal(post.status, 200)
    assert.ok(post.body.body.length > 0)

    const services = await api('GET', '/api/public/services')
    assert.deepEqual(
      services.body.map((s: { id: string; index: string }) => `${s.index} ${s.id}`),
      ['01 roads-infrastructure', '02 earthworks', '03 asphalt-pavement', '04 buildings-works', '05 general-contracting', '06 material-supply'],
    )
    assert.ok(!JSON.stringify(services.body).match(/leas|rental/i), 'no fleet rental services')
    assert.equal((await api('GET', '/api/public/equipment')).status, 404, 'equipment endpoint removed')

    const certificates = await api('GET', '/api/public/certificates')
    assert.deepEqual(
      certificates.body.map((c: { reference: string; expiryDate: string }) => `${c.reference} ${c.expiryDate}`),
      ['DAPL/QMS/EDG1032 2028-04-17', 'DAPL/EMS/EDG1012 2028-04-17', 'DAPL/OH&S/EDG1012 2028-04-17'],
      'ISO certificates from the company profile',
    )
  })

  test('accepts a valid contact enquiry and rejects an invalid one', async () => {
    const api = client(server.base)
    const bad = await api('POST', '/api/public/enquiries', { name: 'A', email: 'nope', subject: '', message: 'short' })
    assert.equal(bad.status, 400)
    assert.ok(bad.body.fields.email)
    assert.ok(bad.body.fields.message)

    const ok = await api('POST', '/api/public/enquiries', {
      name: 'Test Visitor',
      email: 'visitor@example.com',
      phone: '+974 5555 1234',
      subject: 'General Contracting',
      message: 'We need two wheel loaders for three months.',
    })
    assert.equal(ok.status, 201)
    assert.match(ok.body.reference, /^ENQ-\d+$/)
  })

  test('hides unpublished blog posts', async () => {
    const api = client(server.base)
    const missing = await api('GET', '/api/public/blogs/does-not-exist')
    assert.equal(missing.status, 404)
  })
})

describe('authentication', () => {
  test('protects admin endpoints', async () => {
    const api = client(server.base)
    assert.equal((await api('GET', '/api/admin/dashboard')).status, 401)
    assert.equal((await api('GET', '/api/auth/me')).status, 401)
  })

  test('rejects bad credentials without revealing which part was wrong', async () => {
    const api = client(server.base)
    const wrongPassword = await api('POST', '/api/auth/login', { email: ADMIN.email, password: 'wrong-password-1' })
    const unknownUser = await api('POST', '/api/auth/login', { email: 'ghost@example.com', password: 'wrong-password-1' })
    assert.equal(wrongPassword.status, 401)
    assert.equal(unknownUser.status, 401)
    assert.equal(wrongPassword.body.error, unknownUser.body.error)
  })

  test('signs in with an httpOnly session cookie and signs out', async () => {
    const api = client(server.base)
    const login = await api('POST', '/api/auth/login', ADMIN)
    assert.equal(login.status, 200)
    assert.equal(login.body.user.role, 'super_admin')
    assert.match(login.headers.get('set-cookie') ?? '', /HttpOnly/i)
    assert.match(login.headers.get('set-cookie') ?? '', /SameSite=Lax/i)
    assert.equal((await api('GET', '/api/auth/me')).status, 200)
    assert.equal((await api('POST', '/api/auth/logout', {})).status, 204)
    assert.equal((await api('GET', '/api/auth/me')).status, 401)
  })

  test('blocks cross-origin and non-JSON writes', async () => {
    const api = client(server.base)
    const cross = await api('POST', '/api/auth/login', ADMIN, { origin: 'https://evil.example' })
    assert.equal(cross.status, 403)
    const form = await fetch(`${server.base}/api/public/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'name=x',
    })
    assert.equal(form.status, 415)
  })
})

describe('admin API', () => {
  const api = () => client(server.base)
  let owner: ReturnType<typeof client>

  before(async () => {
    owner = api()
    assert.equal((await owner('POST', '/api/auth/login', ADMIN)).status, 200)
  })

  test('dashboard summarises live data', async () => {
    const res = await owner('GET', '/api/admin/dashboard')
    assert.equal(res.status, 200)
    assert.equal(res.body.projects.current.length, 1)
    assert.equal(res.body.projects.completed.length, 14)
    assert.equal(res.body.blogs.total, 7)
    assert.deepEqual(res.body.services, { total: 6, hidden: 0 })
    assert.deepEqual(res.body.certificates, { total: 3, expiringSoon: 0 })
    assert.equal(res.body.equipment, undefined)
    assert.ok(res.body.enquiries.total >= 1)
  })

  test('enquiry lifecycle: log, update status, delete', async () => {
    const created = await owner('POST', '/api/admin/enquiries', {
      name: 'Phone Caller',
      company: 'Caller Contracting',
      email: 'caller@example.com',
      phone: '+974 4444 0000',
      requirement: 'Road rollers — 2 units',
      source: 'phone',
    })
    assert.equal(created.status, 201)
    const id = created.body.id
    const updated = await owner('PATCH', `/api/admin/enquiries/${id}`, { status: 'contacted' })
    assert.equal(updated.body.status, 'contacted')
    assert.equal((await owner('PATCH', `/api/admin/enquiries/${id}`, { status: 'bogus' })).status, 400)
    assert.equal((await owner('DELETE', `/api/admin/enquiries/${id}`)).status, 204)
    assert.equal((await owner('PATCH', `/api/admin/enquiries/${id}`, { status: 'closed' })).status, 404)
  })

  test('project changes flow through to the public website', async () => {
    const created = await owner('POST', '/api/admin/projects', {
      title: 'Test Road Upgrade',
      client: 'Test Authority',
      location: 'Al Khor, Qatar',
      description: 'Road widening test project.',
      valueQar: 9750000,
      status: 'current',
      startDate: '2026',
      endDate: '2027-01-15',
      progress: 41,
      image: 'qatar-highway',
    })
    assert.equal(created.status, 201)
    assert.equal(created.body.slug, 'test-road-upgrade')

    let site = await api()('GET', '/api/public/projects')
    const listed = site.body.find((p: { id: string }) => p.id === 'test-road-upgrade')
    assert.equal(listed.value, 'QAR 9.8M')
    assert.equal(listed.status, 'Ongoing')

    await owner('PUT', `/api/admin/projects/${created.body.id}`, { ...created.body, valueQar: 9750000, status: 'pending' })
    site = await api()('GET', '/api/public/projects')
    assert.ok(!site.body.some((p: { id: string }) => p.id === 'test-road-upgrade'), 'pending projects are hidden')

    assert.equal((await owner('DELETE', `/api/admin/projects/${created.body.id}`)).status, 204)
  })

  test('draft blog posts stay off the website until published', async () => {
    const draft = await owner('POST', '/api/admin/blogs', {
      title: 'Draft Post',
      excerpt: 'Not live yet.',
      category: 'Safety',
      author: 'Owner',
      image: 'doha-skyline',
      body: [{ type: 'paragraph', text: 'Hello world.' }],
      status: 'draft',
      publishDate: '2026-01-01',
    })
    assert.equal(draft.status, 201)
    assert.equal((await api()('GET', '/api/public/blogs/draft-post')).status, 404)
    const published = await owner('PUT', `/api/admin/blogs/${draft.body.id}`, { ...draft.body, status: 'published' })
    assert.equal(published.status, 200)
    assert.equal((await api()('GET', '/api/public/blogs/draft-post')).status, 200)
    const dup = await owner('POST', '/api/admin/blogs', { ...draft.body, slug: 'draft-post' })
    assert.equal(dup.status, 400)
    assert.ok(dup.body.fields.slug)
  })

  test('services: validation, CRUD and website visibility', async () => {
    const bad = await owner('POST', '/api/admin/services', { title: '', short: '', description: '' })
    assert.equal(bad.status, 400)
    assert.ok(bad.body.fields.title && bad.body.fields.short && bad.body.fields.description && bad.body.fields.image)

    const created = await owner('POST', '/api/admin/services', {
      title: 'Site Preparation',
      short: 'Clearing and leveling ahead of construction.',
      description: 'Complete site preparation for new developments.',
      bullets: ['Land clearing', '', 'Leveling'],
      image: 'qatar-highway',
      sortOrder: 15,
    })
    assert.equal(created.status, 201)
    assert.equal(created.body.slug, 'site-preparation')
    assert.deepEqual(created.body.bullets, ['Land clearing', 'Leveling'], 'empty bullets dropped')

    let site = await api()('GET', '/api/public/services')
    assert.deepEqual(site.body.map((s: { id: string }) => s.id), ['roads-infrastructure', 'site-preparation', 'earthworks', 'asphalt-pavement', 'buildings-works', 'general-contracting', 'material-supply'], 'ordered by display order')

    await owner('PUT', `/api/admin/services/${created.body.id}`, { ...created.body, visible: false })
    site = await api()('GET', '/api/public/services')
    assert.ok(!site.body.some((s: { id: string }) => s.id === 'site-preparation'), 'hidden services are not on the website')

    assert.equal((await owner('DELETE', `/api/admin/services/${created.body.id}`)).status, 204)
    assert.equal((await owner('GET', '/api/admin/equipment')).status, 404, 'equipment API removed')
  })

  test('certificates: PDF or image upload, About page visibility, cleanup', async () => {
    const pdf = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF').toString('base64')}`
    const file = (await owner('POST', '/api/admin/uploads', { dataUrl: pdf, folder: 'certificates' })).body.url
    assert.match(file, /\/ihe\/certificates\/.+\.pdf$/)
    assert.equal((await owner('POST', '/api/admin/uploads', { dataUrl: pdf, folder: 'blogs' })).status, 400, 'PDFs only for certificates')

    const bad = await owner('POST', '/api/admin/certificates', { title: '', issuer: '', issueDate: '2026-05-01', expiryDate: '2025-01-01' })
    assert.equal(bad.status, 400)
    assert.ok(bad.body.fields.title && bad.body.fields.issuer && bad.body.fields.file && bad.body.fields.expiryDate)

    const cert = await owner('POST', '/api/admin/certificates', {
      title: 'Quality Management System',
      issuer: 'Test Registrar',
      reference: 'QMS-001',
      issueDate: '2026-01-10',
      expiryDate: '2029-01-09',
      file,
    })
    assert.equal(cert.status, 201)
    assert.equal(cert.body.fileType, 'pdf')

    const onAbout = async () => ((await api()('GET', '/api/public/certificates')).body as { title: string; visible?: boolean }[]).filter((c) => c.title === 'Quality Management System')
    let about = await onAbout()
    assert.equal(about.length, 1)
    assert.equal(about[0].visible, undefined, 'admin-only fields are not exposed')

    await owner('PUT', `/api/admin/certificates/${cert.body.id}`, { ...cert.body, visible: false })
    about = await onAbout()
    assert.equal(about.length, 0, 'hidden certificates are not on the About page')

    // The seeded ISO certificates use bundled scans; editing them keeps that file.
    const iso = (await owner('GET', '/api/admin/certificates')).body.find((c: { reference: string }) => c.reference === 'DAPL/QMS/EDG1032')
    assert.equal((await owner('PUT', `/api/admin/certificates/${iso.id}`, { ...iso, description: 'Edited' })).status, 200)

    await owner('DELETE', `/api/admin/certificates/${cert.body.id}`)
    assert.ok(media.removed.includes(file), 'certificate file deleted from Cloudinary')
  })

  test('role permissions are enforced server-side', async () => {
    const created = await owner('POST', '/api/admin/users', {
      name: 'Content Person',
      email: 'content@example.com',
      role: 'content_manager',
      password: 'Content12345',
    })
    assert.equal(created.status, 201)
    const content = api()
    assert.equal((await content('POST', '/api/auth/login', { email: 'content@example.com', password: 'Content12345' })).status, 200)
    assert.equal((await content('GET', '/api/admin/blogs')).status, 200)
    assert.equal((await content('GET', '/api/admin/services')).status, 200)
    assert.equal((await content('GET', '/api/admin/certificates')).status, 200)
    assert.equal((await content('GET', '/api/admin/enquiries')).status, 403)
    assert.equal((await content('GET', '/api/admin/users')).status, 403)
    assert.equal((await content('PUT', '/api/admin/settings/company', {})).status, 403)
    const dash = await content('GET', '/api/admin/dashboard')
    assert.equal(dash.body.enquiries.recent.length, 0, 'enquiry details are hidden from content managers')

    // Deactivating the user ends their sessions immediately.
    await owner('PUT', `/api/admin/users/${created.body.id}`, { ...created.body, status: 'inactive' })
    assert.equal((await content('GET', '/api/admin/blogs')).status, 401)
    const relogin = await content('POST', '/api/auth/login', { email: 'content@example.com', password: 'Content12345' })
    assert.equal(relogin.status, 403)
  })

  test('the last super admin cannot be removed or demoted', async () => {
    const me = (await owner('GET', '/api/auth/me')).body.user
    assert.equal((await owner('DELETE', `/api/admin/users/${me.id}`)).status, 400)
    const demote = await owner('PUT', `/api/admin/users/${me.id}`, { ...me, role: 'content_manager' })
    assert.equal(demote.status, 400)
  })

  test('password change requires the current password and keeps this session', async () => {
    const wrong = await owner('PUT', '/api/admin/settings/password', {
      currentPassword: 'not-it-123',
      newPassword: 'NewPassword99',
      confirmPassword: 'NewPassword99',
    })
    assert.equal(wrong.status, 400)
    const other = api()
    await other('POST', '/api/auth/login', ADMIN)
    const ok = await owner('PUT', '/api/admin/settings/password', {
      currentPassword: ADMIN.password,
      newPassword: 'NewPassword99',
      confirmPassword: 'NewPassword99',
    })
    assert.equal(ok.status, 204)
    assert.equal((await owner('GET', '/api/auth/me')).status, 200, 'current session survives')
    assert.equal((await other('GET', '/api/auth/me')).status, 401, 'other sessions are revoked')
    ADMIN.password = 'NewPassword99'
  })

  const PNG = `data:image/png;base64,${'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}`

  test('uploads go to Cloudinary and accept real images only', async () => {
    const ok = await owner('POST', '/api/admin/uploads', { dataUrl: PNG, folder: 'blogs' })
    assert.equal(ok.status, 201)
    assert.match(ok.body.url, /^https:\/\/res\.cloudinary\.com\/.+\/ihe\/blogs\/.+\.png$/)

    const fake = await owner('POST', '/api/admin/uploads', { dataUrl: `data:image/png;base64,${Buffer.from('<svg onload=alert(1)>').toString('base64')}`, folder: 'blogs' })
    assert.equal(fake.status, 400)
    assert.equal((await owner('POST', '/api/admin/uploads', { dataUrl: PNG, folder: 'nope' })).status, 400)
  })

  test('replacing or deleting an image removes the old file from Cloudinary', async () => {
    const first = (await owner('POST', '/api/admin/uploads', { dataUrl: PNG, folder: 'services' })).body.url
    const second = (await owner('POST', '/api/admin/uploads', { dataUrl: PNG, folder: 'services' })).body.url
    const service = { title: 'Image Test Service', short: 'Short summary.', description: 'Longer description.', image: first }
    const item = await owner('POST', '/api/admin/services', service)
    assert.equal(item.status, 201)
    assert.equal(item.body.image, first)

    await owner('PUT', `/api/admin/services/${item.body.id}`, { ...item.body, image: second })
    assert.ok(media.removed.includes(first), 'old image deleted when replaced')
    await owner('DELETE', `/api/admin/services/${item.body.id}`)
    assert.ok(media.removed.includes(second), 'image deleted with its record')

    const foreign = await owner('POST', '/api/admin/services', { ...service, image: 'https://evil.example/x.png' })
    assert.equal(foreign.status, 400, 'only Cloudinary or bundled images are accepted')
  })
})
