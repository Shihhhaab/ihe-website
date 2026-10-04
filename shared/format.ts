import type { ProjectRecord, PublicProject } from './types.ts'

/** "QAR 45M" style used on the public website. */
export function formatQarCompact(value: number | null): string {
  if (value === null) return '—'
  if (value >= 1_000_000) return `QAR ${+(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `QAR ${+(value / 1_000).toFixed(1)}K`
  return `QAR ${value}`
}

/** "QAR 18,400,000" style used in the admin panel. */
export function formatQarFull(value: number | null): string {
  return value === null ? '—' : `QAR ${value.toLocaleString('en-US')}`
}

/** Parses "QAR 45M" / "QAR 1.5K" / "QAR 1200" back into a number. */
export function parseQar(text: string): number | null {
  const match = text.replace(/,/g, '').match(/([\d.]+)\s*([MK])?/i)
  if (!match) return null
  const n = Number(match[1])
  const unit = match[2]?.toUpperCase()
  return Math.round(unit === 'M' ? n * 1_000_000 : unit === 'K' ? n * 1_000 : n)
}

const year = (date: string | null) => (date ? date.slice(0, 4) : null)

/** "2024 – 2026" from a project's start and end dates. */
export function projectPeriod(start: string | null, end: string | null): string {
  const a = year(start)
  const b = year(end)
  if (a && b) return a === b ? a : `${a} – ${b}`
  return a ?? b ?? ''
}

/** Maps an admin project record to the shape used by the public website. */
export function toPublicProject(p: ProjectRecord): PublicProject {
  return {
    id: p.slug,
    title: p.title,
    client: p.client,
    scope: p.scope ?? '',
    summary: p.description,
    period: projectPeriod(p.startDate, p.endDate),
    status: p.status === 'completed' ? 'Completed' : 'Ongoing',
    value: formatQarCompact(p.valueQar),
    location: p.location,
    image: p.image,
    imageAlt: p.imageAlt,
    featured: p.featured,
  }
}

export function estimateReadMinutes(words: number) {
  return Math.max(1, Math.round(words / 200))
}
