/*
 * Domain types shared by the public site, the admin panel and the backend API.
 *
 * Imports between files in /shared use explicit `.ts` extensions so the backend
 * can run them directly with Node's built-in TypeScript support.
 */

/* ─── Public (website) shapes ─────────────────────────────── */

export type PublicProjectStatus = 'Ongoing' | 'Completed'

export interface PublicProject {
  id: string
  title: string
  client: string
  scope: string
  summary: string
  period: string
  status: PublicProjectStatus
  value: string
  location: string
  /** Image manifest key (bundled photography) or an uploaded image URL. */
  image: string
  imageAlt: string
  featured?: boolean
}

export type BlogBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }

export interface PublicBlogPost {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string // ISO 8601 (YYYY-MM-DD)
  readMinutes: number
  image: string
  imageAlt: string
  featured?: boolean
  placeholder?: boolean
  body: BlogBlock[]
}

export interface PublicService {
  /** URL anchor on the Services page, e.g. /services#road-asphalt */
  id: string
  /** Display number, e.g. "01" */
  index: string
  title: string
  short: string
  description: string
  bullets: string[]
  image: string
  imageAlt: string
}

export type CertificateFileType = 'image' | 'pdf'

export interface PublicCertificate {
  id: number
  title: string
  issuer: string
  reference: string | null
  issueDate: string | null
  expiryDate: string | null
  description: string | null
  /** Cloudinary URL of the certificate scan (image or PDF). */
  file: string
  fileType: CertificateFileType
}

/* ─── Admin records ───────────────────────────────────────── */

export type Role = 'super_admin' | 'content_manager' | 'enquiry_manager'
export type UserStatus = 'active' | 'inactive'

export interface AdminUser {
  id: number
  name: string
  email: string
  role: Role
  status: UserStatus
  phone: string | null
  bio: string | null
  avatarUrl: string | null
  lastLoginAt: string | null
  createdAt: string
}

export type EnquiryStatus = 'new' | 'in_progress' | 'contacted' | 'closed'
export type EnquirySource = 'website' | 'phone' | 'email' | 'in_person'

export interface Enquiry {
  id: number
  reference: string
  name: string
  company: string | null
  email: string
  phone: string | null
  requirement: string
  message: string | null
  status: EnquiryStatus
  source: EnquirySource
  createdAt: string
}

export type BlogStatus = 'published' | 'draft'

export interface BlogPostRecord {
  id: number
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  image: string
  imageAlt: string
  body: BlogBlock[]
  status: BlogStatus
  featured: boolean
  publishDate: string
  readMinutes: number
  updatedAt: string
}

export type ProjectStatus = 'current' | 'completed' | 'pending'

export interface ProjectRecord {
  id: number
  slug: string
  title: string
  client: string
  location: string
  description: string
  scope: string | null
  valueQar: number | null
  status: ProjectStatus
  /** `YYYY` or `YYYY-MM-DD` */
  startDate: string | null
  /** Target date for current work, completion date for completed, expected start for pending. */
  endDate: string | null
  progress: number | null
  image: string
  imageAlt: string
  featured: boolean
  updatedAt: string
}

export interface ServiceRecord {
  id: number
  slug: string
  title: string
  short: string
  description: string
  bullets: string[]
  image: string
  imageAlt: string
  /** Hidden services stay in the admin panel but are not shown on the website. */
  visible: boolean
  /** Lower numbers are listed first. */
  sortOrder: number
  updatedAt: string
}

export interface CertificateRecord {
  id: number
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
  updatedAt: string
}

export interface CompanySettings {
  companyName: string
  companyEmail: string
  companyPhone: string
  timezone: string
  companyAddress: string
  logoUrl: string | null
}

export interface NotificationPrefs {
  newEnquiry: boolean
  weeklySummary: boolean
  projectStatus: boolean
  contentUpdates: boolean
  systemAlerts: boolean
}

export interface SessionInfo {
  id: number
  userAgent: string | null
  createdAt: string
  lastSeenAt: string
  current: boolean
}

export interface ActivityItem {
  id: number
  kind: 'enquiry' | 'project' | 'blog' | 'service' | 'certificate' | 'user' | 'settings'
  title: string
  detail: string
  createdAt: string
}

export interface DashboardSummary {
  enquiries: { total: number; thisMonth: number; recent: Enquiry[] }
  projects: { current: ProjectRecord[]; completed: ProjectRecord[]; pending: ProjectRecord[]; dueThisQuarter: number }
  services: { total: number; hidden: number }
  certificates: { total: number; expiringSoon: number }
  blogs: { total: number; drafts: number }
  activity: ActivityItem[]
}

export interface SearchResult {
  kind: 'enquiry' | 'project' | 'service' | 'certificate' | 'blog'
  id: number
  title: string
  subtitle: string
  href: string
}

/** Standard error body returned by the API. */
export interface ApiError {
  error: string
  fields?: Record<string, string>
}
