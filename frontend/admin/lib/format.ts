/* Formatting and list helpers shared by admin pages. */

export const PAGE_SIZE = 10

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(page, pages)
  const start = (current - 1) * size
  return { rows: items.slice(start, start + size), pages, current, start }
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

/** "2026-09-18" from an ISO timestamp, in local time. */
export const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '—')

export function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minute${diff < 120 ? '' : 's'} ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${diff < 7200 ? '' : 's'} ago`
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diff < 172800) return `Yesterday, ${time}`
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Converts an optional numeric input to a number or null. */
export const toNumberOrNull = (v: string) => (v.trim() === '' ? null : Number(v))
