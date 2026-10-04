/*
 * Input validation shared by the frontends (inline form errors) and the
 * backend (authoritative checks). Every validator takes untrusted input and
 * returns either a cleaned value or a map of field errors.
 */
import {
  BLOG_CATEGORIES,
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  PROJECT_STATUSES,
  ROLES,
  TIMEZONES,
} from './constants.ts'
import type {
  BlogBlock,
  BlogStatus,
  CertificateFileType,
  CompanySettings,
  EnquirySource,
  EnquiryStatus,
  NotificationPrefs,
  ProjectStatus,
  Role,
  UserStatus,
} from './types.ts'

export type FieldErrors = Record<string, string>
export type Result<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors }

type Input = Record<string, unknown>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^[+()\d\s-]{7,20}$/
const DATE = /^\d{4}(-\d{2}-\d{2})?$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/** Image delivered by Cloudinary, e.g. https://res.cloudinary.com/<cloud>/image/upload/v1/ihe/blogs/<id>.jpg */
export const CLOUDINARY_IMAGE = /^https:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\/[\w\-./]+\.(png|jpe?g|webp)$/
/** Certificate scans may also be PDFs (Cloudinary stores them as images and renders page previews). */
export const CLOUDINARY_DOCUMENT = /^https:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\/[\w\-./]+\.(png|jpe?g|webp|pdf)$/

/** Small collector that keeps validators readable. */
class Checker {
  errors: FieldErrors = {}
  private input: Input

  constructor(input: unknown) {
    this.input = input && typeof input === 'object' ? (input as Input) : {}
  }

  raw(key: string) {
    return this.input[key]
  }

  text(key: string, label: string, opts: { required?: boolean; min?: number; max?: number } = {}): string {
    const { required = false, min = 0, max = 500 } = opts
    const value = typeof this.input[key] === 'string' ? (this.input[key] as string).trim() : ''
    if (!value) {
      if (required) this.errors[key] = `${label} is required.`
      return ''
    }
    if (value.length < min) this.errors[key] = `${label} must be at least ${min} characters.`
    else if (value.length > max) this.errors[key] = `${label} must be ${max} characters or fewer.`
    return value
  }

  optionalText(key: string, label: string, max = 500): string | null {
    return this.text(key, label, { max }) || null
  }

  email(key: string, label = 'Email', required = true): string {
    const value = this.text(key, label, { required, max: 254 }).toLowerCase()
    if (value && !EMAIL.test(value)) this.errors[key] = 'Please enter a valid email address.'
    return value
  }

  phone(key: string, label = 'Phone', required = false): string | null {
    const value = this.text(key, label, { required, max: 20 })
    if (value && !PHONE.test(value)) this.errors[key] = 'Please enter a valid phone number.'
    return value || null
  }

  oneOf<T extends string>(key: string, label: string, options: readonly T[], fallback?: T): T {
    const value = this.input[key]
    if (typeof value === 'string' && (options as readonly string[]).includes(value)) return value as T
    if (fallback !== undefined && (value === undefined || value === null || value === '')) return fallback
    this.errors[key] = `Choose a valid ${label.toLowerCase()}.`
    return options[0]
  }

  int(key: string, label: string, opts: { min?: number; max?: number } = {}): number | null {
    const value = this.input[key]
    if (value === undefined || value === null || value === '') return null
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isInteger(n)) {
      this.errors[key] = `${label} must be a whole number.`
      return null
    }
    if (opts.min !== undefined && n < opts.min) this.errors[key] = `${label} must be at least ${opts.min}.`
    if (opts.max !== undefined && n > opts.max) this.errors[key] = `${label} must be at most ${opts.max}.`
    return n
  }

  bool(key: string): boolean {
    return this.input[key] === true
  }

  date(key: string, label: string): string | null {
    const value = this.text(key, label, { max: 10 })
    if (value && !DATE.test(value)) this.errors[key] = `${label} must be YYYY or YYYY-MM-DD.`
    return value || null
  }

  image(key: string, label = 'Image'): string | null {
    const value = this.text(key, label, { max: 300 })
    // Either a bundled image key (e.g. "doha-skyline") or an image uploaded to Cloudinary.
    if (value && !/^[a-z0-9-]+$/.test(value) && !CLOUDINARY_IMAGE.test(value)) {
      this.errors[key] = `${label} is not a valid image reference.`
    }
    return value || null
  }

  result<T>(value: T): Result<T> {
    return Object.keys(this.errors).length ? { ok: false, errors: this.errors } : { ok: true, value }
  }
}

/* ─── Enquiries ───────────────────────────────────────────── */

export interface EnquiryInput {
  name: string
  company: string | null
  email: string
  phone: string | null
  requirement: string
  message: string | null
}

/** Public website contact form. */
export function validatePublicEnquiry(input: unknown): Result<EnquiryInput> {
  const c = new Checker(input)
  const value: EnquiryInput = {
    name: c.text('name', 'Full name', { required: true, min: 2, max: 120 }),
    company: c.optionalText('company', 'Company', 160),
    email: c.email('email'),
    phone: c.phone('phone'),
    requirement: c.text('subject', 'Subject', { required: true, max: 160 }),
    message: c.text('message', 'Message', { required: true, min: 10, max: 5000 }),
  }
  if (c.errors.message?.includes('at least')) c.errors.message = 'Please add a few details about your request (10+ characters).'
  if (c.errors.name?.includes('at least')) c.errors.name = 'Please enter your full name.'
  return c.result(value)
}

/** Enquiry logged manually by an admin (phone, email, in person). */
export function validateAdminEnquiry(input: unknown): Result<EnquiryInput & { source: EnquirySource; status: EnquiryStatus }> {
  const c = new Checker(input)
  return c.result({
    name: c.text('name', 'Full name', { required: true, min: 2, max: 120 }),
    company: c.text('company', 'Company', { required: true, max: 160 }),
    email: c.email('email'),
    phone: c.phone('phone', 'Phone', true),
    requirement: c.text('requirement', 'Requirement', { required: true, max: 200 }),
    message: c.optionalText('message', 'Message', 5000),
    source: c.oneOf('source', 'Source', ENQUIRY_SOURCES, 'phone'),
    status: c.oneOf('status', 'Status', ENQUIRY_STATUSES, 'new'),
  })
}

export function validateEnquiryStatus(input: unknown): Result<{ status: EnquiryStatus }> {
  const c = new Checker(input)
  return c.result({ status: c.oneOf('status', 'Status', ENQUIRY_STATUSES) })
}

/* ─── Blogs ───────────────────────────────────────────────── */

export interface BlogInput {
  title: string
  slug: string
  excerpt: string
  category: string
  author: string
  image: string
  imageAlt: string
  body: BlogBlock[]
  status: BlogStatus
  featured: boolean
  publishDate: string
}

export function validateBlog(input: unknown): Result<BlogInput> {
  const c = new Checker(input)
  const title = c.text('title', 'Title', { required: true, max: 160 })
  const slug = c.text('slug', 'Slug', { max: 120 }) || slugify(title)
  if (slug && !SLUG.test(slug)) c.errors.slug = 'Slug may only contain lowercase letters, numbers and hyphens.'
  const body = c.raw('body')
  const blocks = Array.isArray(body) ? (body as BlogBlock[]).filter(isBlock) : []
  if (!blocks.length) c.errors.body = 'Content is required.'
  const publishDate = c.date('publishDate', 'Publish date') ?? new Date().toISOString().slice(0, 10)
  if (publishDate.length !== 10) c.errors.publishDate = 'Publish date must be YYYY-MM-DD.'
  return c.result({
    title,
    slug,
    excerpt: c.text('excerpt', 'Excerpt', { required: true, max: 300 }),
    category: c.oneOf('category', 'Category', BLOG_CATEGORIES),
    author: c.text('author', 'Author', { required: true, max: 120 }),
    image: c.image('image', 'Cover image') ?? '',
    imageAlt: c.text('imageAlt', 'Image description', { max: 200 }),
    body: blocks,
    status: c.oneOf('status', 'Status', ['published', 'draft'] as const, 'draft'),
    featured: c.bool('featured'),
    publishDate,
  })
}

function isBlock(b: unknown): b is BlogBlock {
  if (!b || typeof b !== 'object') return false
  const block = b as { type?: unknown; text?: unknown; items?: unknown }
  if (block.type === 'list') return Array.isArray(block.items) && block.items.every((i) => typeof i === 'string')
  return ['paragraph', 'heading', 'quote'].includes(block.type as string) && typeof block.text === 'string'
}

/* ─── Projects ────────────────────────────────────────────── */

export interface ProjectInput {
  title: string
  client: string
  location: string
  description: string
  scope: string | null
  valueQar: number | null
  status: ProjectStatus
  startDate: string | null
  endDate: string | null
  progress: number | null
  image: string
  imageAlt: string
  featured: boolean
}

export function validateProject(input: unknown): Result<ProjectInput> {
  const c = new Checker(input)
  const status = c.oneOf('status', 'Status', PROJECT_STATUSES, 'current')
  return c.result({
    title: c.text('title', 'Project name', { required: true, max: 160 }),
    client: c.text('client', 'Client', { required: true, max: 160 }),
    location: c.text('location', 'Location', { required: true, max: 120 }),
    description: c.text('description', 'Description', { required: true, max: 600 }),
    scope: c.optionalText('scope', 'Scope of work', 600),
    valueQar: c.int('valueQar', 'Project value', { min: 0, max: 100_000_000_000 }),
    status,
    startDate: c.date('startDate', 'Start date'),
    endDate: c.date('endDate', 'End date'),
    progress: status === 'current' ? c.int('progress', 'Progress', { min: 0, max: 100 }) : null,
    image: c.image('image', 'Project image') ?? '',
    imageAlt: c.text('imageAlt', 'Image description', { max: 200 }),
    featured: c.bool('featured'),
  })
}

/* ─── Services ────────────────────────────────────────────── */

export interface ServiceInput {
  title: string
  slug: string
  short: string
  description: string
  bullets: string[]
  image: string
  imageAlt: string
  visible: boolean
  sortOrder: number
}

export function validateService(input: unknown): Result<ServiceInput> {
  const c = new Checker(input)
  const title = c.text('title', 'Service name', { required: true, max: 120 })
  const slug = c.text('slug', 'URL anchor', { max: 80 }) || slugify(title)
  if (slug && !SLUG.test(slug)) c.errors.slug = 'Use only lowercase letters, numbers and hyphens.'
  const rawBullets = c.raw('bullets')
  const bullets = (Array.isArray(rawBullets) ? rawBullets : [])
    .filter((b): b is string => typeof b === 'string')
    .map((b) => b.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 12)
  const image = c.image('image', 'Service image')
  if (!image) c.errors.image = 'A service image is required.'
  return c.result({
    title,
    slug,
    short: c.text('short', 'Summary', { required: true, max: 240 }),
    description: c.text('description', 'Description', { required: true, max: 1000 }),
    bullets,
    image: image ?? '',
    imageAlt: c.text('imageAlt', 'Image description', { max: 200 }),
    visible: c.raw('visible') !== false,
    sortOrder: c.int('sortOrder', 'Display order', { min: 0, max: 9999 }) ?? 0,
  })
}

/* ─── Certificates ────────────────────────────────────────── */

export interface CertificateInput {
  title: string
  issuer: string
  reference: string | null
  issueDate: string | null
  expiryDate: string | null
  description: string | null
  file: string
  fileType: CertificateFileType
  visible: boolean
  sortOrder: number
}

export function validateCertificate(input: unknown): Result<CertificateInput> {
  const c = new Checker(input)
  const file = c.text('file', 'Certificate file', { required: true, max: 300 })
  // A Cloudinary upload (image or PDF) or a certificate scan bundled with the website.
  if (file && !CLOUDINARY_DOCUMENT.test(file) && !/^[a-z0-9-]+$/.test(file)) c.errors.file = 'Upload the certificate as an image or PDF.'
  const issueDate = c.date('issueDate', 'Issue date')
  const expiryDate = c.date('expiryDate', 'Expiry date')
  if (issueDate && expiryDate && expiryDate < issueDate) c.errors.expiryDate = 'Expiry date must be after the issue date.'
  return c.result({
    title: c.text('title', 'Certificate name', { required: true, max: 160 }),
    issuer: c.text('issuer', 'Issuing body', { required: true, max: 160 }),
    reference: c.optionalText('reference', 'Certificate number', 80),
    issueDate,
    expiryDate,
    description: c.optionalText('description', 'Description', 500),
    file,
    fileType: file.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
    visible: c.raw('visible') !== false,
    sortOrder: c.int('sortOrder', 'Display order', { min: 0, max: 9999 }) ?? 0,
  })
}

/* ─── Users & settings ────────────────────────────────────── */

export const PASSWORD_MIN = 10

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`
  if (password.length > 200) return 'Password is too long.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain letters and numbers.'
  return null
}

export interface UserInput {
  name: string
  email: string
  role: Role
  status: UserStatus
  password: string | null
}

/** `requirePassword` is true when creating a user; optional (reset) when editing. */
export function validateUser(input: unknown, requirePassword: boolean): Result<UserInput> {
  const c = new Checker(input)
  const password = typeof c.raw('password') === 'string' ? (c.raw('password') as string) : ''
  if (requirePassword || password) {
    const problem = password ? passwordProblem(password) : 'A temporary password is required.'
    if (problem) c.errors.password = problem
  }
  return c.result({
    name: c.text('name', 'Full name', { required: true, min: 2, max: 120 }),
    email: c.email('email'),
    role: c.oneOf('role', 'Role', ROLES, 'content_manager'),
    status: c.oneOf('status', 'Status', ['active', 'inactive'] as const, 'active'),
    password: password || null,
  })
}

export function validateProfile(input: unknown): Result<{ name: string; email: string; phone: string | null; bio: string | null; avatarUrl: string | null }> {
  const c = new Checker(input)
  return c.result({
    name: c.text('name', 'Full name', { required: true, min: 2, max: 120 }),
    email: c.email('email'),
    phone: c.phone('phone'),
    bio: c.optionalText('bio', 'Short bio', 400),
    avatarUrl: c.image('avatarUrl', 'Profile photo'),
  })
}

export function validatePasswordChange(input: unknown): Result<{ currentPassword: string; newPassword: string }> {
  const c = new Checker(input)
  const currentPassword = typeof c.raw('currentPassword') === 'string' ? (c.raw('currentPassword') as string) : ''
  const newPassword = typeof c.raw('newPassword') === 'string' ? (c.raw('newPassword') as string) : ''
  const confirm = typeof c.raw('confirmPassword') === 'string' ? (c.raw('confirmPassword') as string) : ''
  if (!currentPassword) c.errors.currentPassword = 'Current password is required.'
  const problem = passwordProblem(newPassword)
  if (problem) c.errors.newPassword = problem
  else if (newPassword !== confirm) c.errors.confirmPassword = 'Passwords do not match.'
  return c.result({ currentPassword, newPassword })
}

export function validateCompany(input: unknown): Result<CompanySettings> {
  const c = new Checker(input)
  return c.result({
    companyName: c.text('companyName', 'Company name', { required: true, max: 160 }),
    companyEmail: c.email('companyEmail', 'Company email'),
    companyPhone: c.phone('companyPhone', 'Company phone') ?? '',
    timezone: c.oneOf('timezone', 'Timezone', TIMEZONES, TIMEZONES[0]),
    companyAddress: c.text('companyAddress', 'Company address', { max: 300 }),
    logoUrl: c.image('logoUrl', 'Company logo'),
  })
}

export function validateNotificationPrefs(input: unknown): Result<NotificationPrefs> {
  const c = new Checker(input)
  return c.result({
    newEnquiry: c.bool('newEnquiry'),
    weeklySummary: c.bool('weeklySummary'),
    projectStatus: c.bool('projectStatus'),
    contentUpdates: c.bool('contentUpdates'),
    systemAlerts: c.bool('systemAlerts'),
  })
}

/* ─── Helpers ─────────────────────────────────────────────── */

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}
