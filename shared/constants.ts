import type { EnquirySource, EnquiryStatus, ProjectStatus, Role } from './types.ts'

/* ─── Roles & permissions ─────────────────────────────────── */

export const ROLES: Role[] = ['super_admin', 'content_manager', 'enquiry_manager']

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  content_manager: 'Content Manager',
  enquiry_manager: 'Enquiry Manager',
}

/** Admin areas, used both to guard API routes and to show/hide navigation. */
export type Area = 'dashboard' | 'enquiries' | 'blogs' | 'header' | 'projects' | 'services' | 'certificates' | 'users' | 'company'

const ACCESS: Record<Role, Area[]> = {
  super_admin: ['dashboard', 'enquiries', 'blogs', 'header', 'projects', 'services', 'certificates', 'users', 'company'],
  content_manager: ['dashboard', 'blogs', 'header', 'projects', 'services', 'certificates'],
  enquiry_manager: ['dashboard', 'enquiries'],
}

export const canAccess = (role: Role, area: Area) => ACCESS[role].includes(area)

/* ─── Status vocabularies ─────────────────────────────────── */

export const ENQUIRY_STATUSES: EnquiryStatus[] = ['new', 'in_progress', 'contacted', 'closed']
export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  contacted: 'Contacted',
  closed: 'Closed',
}

export const ENQUIRY_SOURCES: EnquirySource[] = ['website', 'phone', 'email', 'in_person']
export const ENQUIRY_SOURCE_LABELS: Record<EnquirySource, string> = {
  website: 'Website',
  phone: 'Phone',
  email: 'Email',
  in_person: 'In person',
}

export const PROJECT_STATUSES: ProjectStatus[] = ['current', 'completed', 'pending']
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  current: 'Current',
  completed: 'Completed',
  pending: 'Pending',
}

export const BLOG_CATEGORIES = ['Industry', 'Road Works', 'Fleet', 'Logistics', 'Safety', 'Company News', 'Projects', 'Guides']

/** Subjects offered on the public contact form. */
export const ENQUIRY_TYPES = [
  'Roads & Infrastructure',
  'Earthworks',
  'Asphalt & Pavement Works',
  'Buildings Works',
  'General Contracting',
  'Material Supply',
  'Pre-Qualification Dossier Request',
]

export const TIMEZONES = ['(GMT+3:00) Doha, Qatar', '(GMT+4:00) Dubai, UAE', '(GMT+0:00) London, UK']
