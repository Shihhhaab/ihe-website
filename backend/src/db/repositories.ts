/*
 * Data access for every admin-managed entity, backed by MongoDB collections.
 * Documents use a numeric `_id` (from `nextId`), exposed as `id` in the
 * records defined in /shared/types.ts.
 */
import type { Filter } from 'mongodb'
import { countWords } from '../../../shared/blogFormat.ts'
import { estimateReadMinutes } from '../../../shared/format.ts'
import type {
  ActivityItem,
  AdminUser,
  BlogPostRecord,
  CertificateRecord,
  CompanySettings,
  Enquiry,
  EnquiryStatus,
  NotificationPrefs,
  ProjectRecord,
  ProjectStatus,
  ServiceRecord,
  SessionInfo,
} from '../../../shared/types.ts'
import type { BlogInput, CertificateInput, EnquiryInput, ProjectInput, ServiceInput, UserInput } from '../../../shared/validation.ts'
import { nextId, now, type Db } from './database.ts'

type Doc<T extends { id: number }> = Omit<T, 'id'> & { _id: number }

/* ─── Users ───────────────────────────────────────────────── */

type UserDoc = Doc<AdminUser> & { passwordHash: string; notificationPrefs: NotificationPrefs }

const DEFAULT_PREFS: NotificationPrefs = { newEnquiry: true, weeklySummary: true, projectStatus: false, contentUpdates: true, systemAlerts: true }

const toUser = ({ _id, passwordHash: _hash, notificationPrefs: _prefs, ...rest }: UserDoc): AdminUser => ({ id: _id, ...rest })

export const users = (db: Db) => {
  const col = db.collection<UserDoc>('users')
  return {
    count: () => col.countDocuments(),
    list: async () => (await col.find().sort({ createdAt: 1 }).toArray()).map(toUser),
    byId: async (id: number) => {
      const doc = await col.findOne({ _id: id })
      return doc ? toUser(doc) : null
    },
    /** Includes the password hash; only used by authentication. */
    credentialsByEmail: async (email: string) => {
      const doc = await col.findOne({ email: email.toLowerCase() })
      return doc ? { user: toUser(doc), passwordHash: doc.passwordHash } : null
    },
    passwordHash: async (id: number) => (await col.findOne({ _id: id }, { projection: { passwordHash: 1 } }))?.passwordHash ?? null,
    emailTaken: async (email: string, exceptId = 0) => !!(await col.findOne({ email: email.toLowerCase(), _id: { $ne: exceptId } })),
    countActiveSuperAdmins: (exceptId = 0) => col.countDocuments({ role: 'super_admin', status: 'active', _id: { $ne: exceptId } }),
    create: async (input: Omit<UserInput, 'password'>, passwordHash: string) => {
      const _id = await nextId(db, 'users')
      await col.insertOne({
        _id,
        name: input.name,
        email: input.email.toLowerCase(),
        role: input.role,
        status: input.status,
        passwordHash,
        phone: null,
        bio: null,
        avatarUrl: null,
        notificationPrefs: DEFAULT_PREFS,
        lastLoginAt: null,
        createdAt: now(),
      })
      return _id
    },
    update: (id: number, input: Omit<UserInput, 'password'>) =>
      col.updateOne({ _id: id }, { $set: { name: input.name, email: input.email.toLowerCase(), role: input.role, status: input.status } }),
    updateProfile: (id: number, p: { name: string; email: string; phone: string | null; bio: string | null; avatarUrl: string | null }) =>
      col.updateOne({ _id: id }, { $set: { ...p, email: p.email.toLowerCase() } }),
    setPassword: (id: number, hash: string) => col.updateOne({ _id: id }, { $set: { passwordHash: hash } }),
    touchLogin: (id: number) => col.updateOne({ _id: id }, { $set: { lastLoginAt: now() } }),
    remove: (id: number) => col.deleteOne({ _id: id }),
    notificationPrefs: async (id: number) => (await col.findOne({ _id: id }))?.notificationPrefs ?? DEFAULT_PREFS,
    setNotificationPrefs: (id: number, prefs: NotificationPrefs) => col.updateOne({ _id: id }, { $set: { notificationPrefs: prefs } }),
  }
}

/* ─── Sessions ────────────────────────────────────────────── */

interface SessionDoc {
  _id: number
  tokenHash: string
  userId: number
  userAgent: string | null
  createdAt: string
  lastSeenAt: string
  /** A Date so MongoDB's TTL index can delete expired sessions. */
  expiresAt: Date
}

export const sessions = (db: Db) => {
  const col = db.collection<SessionDoc>('sessions')
  return {
    create: async (tokenHash: string, userId: number, userAgent: string | null, expiresAt: Date) => {
      const at = now()
      await col.insertOne({ _id: await nextId(db, 'sessions'), tokenHash, userId, userAgent, createdAt: at, lastSeenAt: at, expiresAt })
    },
    /** Returns the session and its user, or null. */
    find: async (tokenHash: string) => {
      const session = await col.findOne({ tokenHash })
      if (!session) return null
      const user = await users(db).byId(session.userId)
      if (!user) return null
      return { sessionId: session._id, expiresAt: session.expiresAt, lastSeenAt: session.lastSeenAt, user }
    },
    touch: (id: number, expiresAt: Date) => col.updateOne({ _id: id }, { $set: { lastSeenAt: now(), expiresAt } }),
    listForUser: async (userId: number, currentId: number): Promise<SessionInfo[]> =>
      (await col.find({ userId, expiresAt: { $gt: new Date() } }).sort({ lastSeenAt: -1 }).toArray()).map((s) => ({
        id: s._id,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        lastSeenAt: s.lastSeenAt,
        current: s._id === currentId,
      })),
    remove: (id: number) => col.deleteOne({ _id: id }),
    removeForUser: (userId: number, id: number) => col.deleteOne({ _id: id, userId }),
    removeAllForUser: (userId: number, exceptId = 0) => col.deleteMany({ userId, _id: { $ne: exceptId } }),
  }
}

/* ─── Enquiries ───────────────────────────────────────────── */

type EnquiryDoc = Omit<Doc<Enquiry>, 'reference'>

const toEnquiry = ({ _id, ...rest }: EnquiryDoc): Enquiry => ({ id: _id, reference: `ENQ-${1000 + _id}`, ...rest })

export const enquiries = (db: Db) => {
  const col = db.collection<EnquiryDoc>('enquiries')
  const newestFirst = { createdAt: -1, _id: -1 } as const
  return {
    list: async () => (await col.find().sort(newestFirst).toArray()).map(toEnquiry),
    recent: async (limit: number) => (await col.find().sort(newestFirst).limit(limit).toArray()).map(toEnquiry),
    byStatus: async (status: EnquiryStatus) => (await col.find({ status }).sort(newestFirst).toArray()).map(toEnquiry),
    byId: async (id: number) => {
      const doc = await col.findOne({ _id: id })
      return doc ? toEnquiry(doc) : null
    },
    create: async (input: EnquiryInput & { source: Enquiry['source']; status?: EnquiryStatus }) => {
      const _id = await nextId(db, 'enquiries')
      await col.insertOne({
        _id,
        name: input.name,
        company: input.company,
        email: input.email,
        phone: input.phone,
        requirement: input.requirement,
        message: input.message,
        status: input.status ?? 'new',
        source: input.source,
        createdAt: now(),
      })
      return _id
    },
    setStatus: (id: number, status: EnquiryStatus) => col.updateOne({ _id: id }, { $set: { status } }),
    remove: (id: number) => col.deleteOne({ _id: id }),
    counts: async () => {
      const monthStart = new Date()
      monthStart.setUTCDate(1)
      monthStart.setUTCHours(0, 0, 0, 0)
      const [total, thisMonth] = await Promise.all([col.countDocuments(), col.countDocuments({ createdAt: { $gte: monthStart.toISOString() } })])
      return { total, thisMonth }
    },
  }
}

/* ─── Blog posts ──────────────────────────────────────────── */

type BlogDoc = Doc<BlogPostRecord> & { createdAt: string }

const toBlog = ({ _id, createdAt: _created, ...rest }: BlogDoc): BlogPostRecord => ({ id: _id, ...rest })

const blogFields = (b: BlogInput) => ({
  slug: b.slug,
  title: b.title,
  excerpt: b.excerpt,
  category: b.category,
  author: b.author,
  image: b.image,
  imageAlt: b.imageAlt,
  body: b.body,
  status: b.status,
  featured: b.featured,
  publishDate: b.publishDate,
  readMinutes: estimateReadMinutes(countWords(b.body)),
})

export const blogs = (db: Db) => {
  const col = db.collection<BlogDoc>('blogs')
  return {
    list: async () => (await col.find().sort({ publishDate: -1, _id: -1 }).toArray()).map(toBlog),
    published: async () =>
      (await col.find({ status: 'published', publishDate: { $lte: now().slice(0, 10) } }).sort({ featured: -1, publishDate: -1 }).toArray()).map(toBlog),
    byId: async (id: number) => {
      const doc = await col.findOne({ _id: id })
      return doc ? toBlog(doc) : null
    },
    slugTaken: async (slug: string, exceptId = 0) => !!(await col.findOne({ slug, _id: { $ne: exceptId } })),
    create: async (b: BlogInput) => {
      const _id = await nextId(db, 'blogs')
      const at = now()
      await col.insertOne({ _id, ...blogFields(b), createdAt: at, updatedAt: at })
      return _id
    },
    update: (id: number, b: BlogInput) => col.updateOne({ _id: id }, { $set: { ...blogFields(b), updatedAt: now() } }),
    /** Only one post is featured on the website at a time. */
    clearFeatured: (exceptId: number) => col.updateMany({ _id: { $ne: exceptId } }, { $set: { featured: false } }),
    remove: (id: number) => col.deleteOne({ _id: id }),
  }
}

/* ─── Projects ────────────────────────────────────────────── */

type ProjectDoc = Doc<ProjectRecord> & { sortOrder: number; createdAt: string }

const toProject = ({ _id, sortOrder: _order, createdAt: _created, ...rest }: ProjectDoc): ProjectRecord => ({ id: _id, ...rest })

const projectFields = (p: ProjectInput) => ({
  title: p.title,
  client: p.client,
  location: p.location,
  description: p.description,
  scope: p.scope,
  valueQar: p.valueQar,
  status: p.status,
  startDate: p.startDate,
  endDate: p.endDate,
  progress: p.progress,
  image: p.image,
  imageAlt: p.imageAlt,
  featured: p.featured,
})

export const projects = (db: Db) => {
  const col = db.collection<ProjectDoc>('projects')
  const order = { featured: -1, sortOrder: 1, _id: -1 } as const
  return {
    list: async (status?: ProjectStatus) => (await col.find(status ? { status } : {}).sort(order).toArray()).map(toProject),
    /** Current and completed projects, as shown on the public website (featured first, then current before completed). */
    published: async () => {
      const docs = await col.find({ status: { $in: ['current', 'completed'] } }).sort({ featured: -1, sortOrder: 1, _id: 1 }).toArray()
      const rank = (d: ProjectDoc) => (d.featured ? 0 : d.status === 'current' ? 1 : 2)
      return docs.sort((a, b) => rank(a) - rank(b)).map(toProject)
    },
    byId: async (id: number) => {
      const doc = await col.findOne({ _id: id })
      return doc ? toProject(doc) : null
    },
    slugTaken: async (slug: string, exceptId = 0) => !!(await col.findOne({ slug, _id: { $ne: exceptId } } as Filter<ProjectDoc>)),
    create: async (slug: string, p: ProjectInput, sortOrder = 0) => {
      const _id = await nextId(db, 'projects')
      const at = now()
      await col.insertOne({ _id, slug, ...projectFields(p), sortOrder, createdAt: at, updatedAt: at })
      return _id
    },
    update: (id: number, p: ProjectInput) => col.updateOne({ _id: id }, { $set: { ...projectFields(p), updatedAt: now() } }),
    remove: (id: number) => col.deleteOne({ _id: id }),
  }
}

/* ─── Services ────────────────────────────────────────────── */

type ServiceDoc = Doc<ServiceRecord> & { createdAt: string }

const toService = ({ _id, createdAt: _created, ...rest }: ServiceDoc): ServiceRecord => ({ id: _id, ...rest })

const serviceFields = (s: ServiceInput) => ({
  slug: s.slug,
  title: s.title,
  short: s.short,
  description: s.description,
  bullets: s.bullets,
  image: s.image,
  imageAlt: s.imageAlt,
  visible: s.visible,
  sortOrder: s.sortOrder,
})

export const services = (db: Db) => {
  const col = db.collection<ServiceDoc>('services')
  const order = { sortOrder: 1, _id: 1 } as const
  return {
    list: async () => (await col.find().sort(order).toArray()).map(toService),
    /** Services shown on the public website. */
    visible: async () => (await col.find({ visible: true }).sort(order).toArray()).map(toService),
    byId: async (id: number) => {
      const doc = await col.findOne({ _id: id })
      return doc ? toService(doc) : null
    },
    slugTaken: async (slug: string, exceptId = 0) => !!(await col.findOne({ slug, _id: { $ne: exceptId } })),
    create: async (s: ServiceInput) => {
      const _id = await nextId(db, 'services')
      const at = now()
      await col.insertOne({ _id, ...serviceFields(s), createdAt: at, updatedAt: at })
      return _id
    },
    update: (id: number, s: ServiceInput) => col.updateOne({ _id: id }, { $set: { ...serviceFields(s), updatedAt: now() } }),
    remove: (id: number) => col.deleteOne({ _id: id }),
  }
}

/* ─── Certificates ────────────────────────────────────────── */

type CertificateDoc = Doc<CertificateRecord> & { createdAt: string }

const toCertificate = ({ _id, createdAt: _created, ...rest }: CertificateDoc): CertificateRecord => ({ id: _id, ...rest })

const certificateFields = (c: CertificateInput) => ({
  title: c.title,
  issuer: c.issuer,
  reference: c.reference,
  issueDate: c.issueDate,
  expiryDate: c.expiryDate,
  description: c.description,
  file: c.file,
  fileType: c.fileType,
  visible: c.visible,
  sortOrder: c.sortOrder,
})

export const certificates = (db: Db) => {
  const col = db.collection<CertificateDoc>('certificates')
  const order = { sortOrder: 1, _id: 1 } as const
  return {
    list: async () => (await col.find().sort(order).toArray()).map(toCertificate),
    /** Certificates shown on the public website's About page. */
    visible: async () => (await col.find({ visible: true }).sort(order).toArray()).map(toCertificate),
    byId: async (id: number) => {
      const doc = await col.findOne({ _id: id })
      return doc ? toCertificate(doc) : null
    },
    create: async (c: CertificateInput) => {
      const _id = await nextId(db, 'certificates')
      const at = now()
      await col.insertOne({ _id, ...certificateFields(c), createdAt: at, updatedAt: at })
      return _id
    },
    update: (id: number, c: CertificateInput) => col.updateOne({ _id: id }, { $set: { ...certificateFields(c), updatedAt: now() } }),
    remove: (id: number) => col.deleteOne({ _id: id }),
  }
}

/* ─── Settings & activity ─────────────────────────────────── */

export const settings = (db: Db) => {
  const col = db.collection<{ _id: string; value: CompanySettings }>('settings')
  return {
    company: async (): Promise<CompanySettings | null> => (await col.findOne({ _id: 'company' }))?.value ?? null,
    setCompany: (value: CompanySettings) => col.updateOne({ _id: 'company' }, { $set: { value } }, { upsert: true }),
  }
}

type ActivityDoc = Doc<ActivityItem>

export const activity = (db: Db) => {
  const col = db.collection<ActivityDoc>('activity')
  return {
    log: async (kind: ActivityItem['kind'], title: string, detail: string) => {
      await col.insertOne({ _id: await nextId(db, 'activity'), kind, title, detail, createdAt: now() })
    },
    recent: async (limit: number) => (await col.find().sort({ _id: -1 }).limit(limit).toArray()).map(({ _id, ...rest }) => ({ id: _id, ...rest })),
  }
}
