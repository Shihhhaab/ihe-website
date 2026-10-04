/*
 * Inserts the company's standard content (from /shared/content) into the
 * database, skipping anything that already exists. Used by first-run seeding
 * and by content migrations, so both produce identical records.
 */
import { seedCertificates } from '../../../shared/content/certificates.ts'
import { seedProjects } from '../../../shared/content/projects.ts'
import { seedServices } from '../../../shared/content/services.ts'
import { parseQar } from '../../../shared/format.ts'
import type { Db } from './database.ts'
import * as repo from './repositories.ts'

/** Returns the number of projects inserted. */
export async function insertProfileProjects(db: Db) {
  const projects = repo.projects(db)
  let inserted = 0
  for (const [i, p] of seedProjects.entries()) {
    if (await projects.slugTaken(p.id)) continue
    // The profile gives completion years only, so a single year is the end date.
    const [a, b] = p.period ? p.period.split(/\s*[–-]\s*/) : []
    await projects.create(
      p.id,
      {
        title: p.title,
        client: p.client,
        location: p.location,
        description: p.summary,
        scope: p.scope || null,
        valueQar: p.value ? parseQar(p.value) : null,
        status: p.status === 'Completed' ? 'completed' : 'current',
        startDate: b ? a : null,
        endDate: b ?? a ?? null,
        progress: null,
        image: p.image,
        imageAlt: p.imageAlt,
        featured: i === 0,
      },
      i,
    )
    inserted++
  }
  return inserted
}

/** Returns the number of services inserted. */
export async function insertProfileServices(db: Db) {
  const services = repo.services(db)
  let inserted = 0
  for (const [i, s] of seedServices.entries()) {
    if (await services.slugTaken(s.id)) continue
    await services.create({
      slug: s.id,
      title: s.title,
      short: s.short,
      description: s.description,
      bullets: s.bullets,
      image: s.image,
      imageAlt: s.imageAlt,
      visible: true,
      sortOrder: (i + 1) * 10,
    })
    inserted++
  }
  return inserted
}

/** Returns the number of certificates inserted (matched on certificate number). */
export async function insertProfileCertificates(db: Db) {
  const certificates = repo.certificates(db)
  const existing = new Set((await certificates.list()).map((c) => c.reference))
  let inserted = 0
  for (const [i, c] of seedCertificates.entries()) {
    if (existing.has(c.reference)) continue
    await certificates.create({ ...c, fileType: 'image', visible: true, sortOrder: (i + 1) * 10 })
    inserted++
  }
  return inserted
}
