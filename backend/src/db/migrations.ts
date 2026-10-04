/*
 * One-time data migrations, recorded in the `migrations` collection so each
 * runs once per database. Append new entries; never edit shipped ones.
 * Run after connecting and before seeding (see server.ts).
 */
import { companyProfile } from '../../../shared/content/company.ts'
import { previousSampleProjectSlugs } from '../../../shared/content/projects.ts'
import type { CompanySettings } from '../../../shared/types.ts'
import { insertProfileCertificates, insertProfileProjects, insertProfileServices } from './content.ts'
import { now, type Db } from './database.ts'

const MIGRATIONS: { id: string; run: (db: Db) => Promise<void> }[] = [
  {
    // The company offers services only: the Fleet & Equipment section was replaced by Services.
    id: '2026-09-28-replace-equipment-with-services',
    async run(db) {
      const existing = await db.listCollections({ name: 'equipment' }, { nameOnly: true }).toArray()
      if (existing.length) await db.collection('equipment').drop()
      await db.collection<{ _id: string }>('counters').deleteOne({ _id: 'equipment' })
      await db.collection('activity').deleteMany({ kind: 'equipment' })
      await db
        .collection('users')
        .updateMany({ 'notificationPrefs.equipmentStatus': { $exists: true } }, { $rename: { 'notificationPrefs.equipmentStatus': 'notificationPrefs.contentUpdates' } })
    },
  },
  {
    // Content from the I.H.E. Company Profile (R26.0) replaces the previous website's sample content.
    id: '2026-09-28-company-profile-r26',
    async run(db) {
      await db.collection('projects').deleteMany({ slug: { $in: previousSampleProjectSlugs } })
      await insertProfileProjects(db)

      await db.collection('services').deleteMany({ slug: { $in: ['road-asphalt', 'earthworks-logistics', 'materials-supply'] } })
      await insertProfileServices(db)

      await insertProfileCertificates(db)

      // Update company settings only where they still hold the previous defaults.
      const settings = db.collection<{ _id: string; value: CompanySettings }>('settings')
      const current = await settings.findOne({ _id: 'company' })
      if (current) {
        const value = { ...current.value }
        if (value.companyName === companyProfile.name) value.companyName = companyProfile.legalName
        if (value.companyAddress === companyProfile.poBox) value.companyAddress = `${companyProfile.address}. ${companyProfile.poBox}`
        await settings.updateOne({ _id: 'company' }, { $set: { value } })
      }
    },
  },
]

export async function runMigrations(db: Db) {
  const done = db.collection<{ _id: string; appliedAt: string }>('migrations')
  for (const m of MIGRATIONS) {
    if (await done.findOne({ _id: m.id })) continue
    await m.run(db)
    await done.insertOne({ _id: m.id, appliedAt: now() })
  }
}
