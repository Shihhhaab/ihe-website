/*
 * Checks the one-time data migrations against a database shaped like earlier
 * releases: the Fleet & Equipment data and the previous website's sample content.
 */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { MongoClient } from 'mongodb'
import { seedCertificates } from '../../shared/content/certificates.ts'
import { seedProjects } from '../../shared/content/projects.ts'
import { seedServices } from '../../shared/content/services.ts'
import { connectDatabase } from '../src/db/database.ts'
import { runMigrations } from '../src/db/migrations.ts'

let uri: string
let stop = async () => {}

before(async () => {
  if (process.env.TEST_MONGODB_URI) {
    uri = process.env.TEST_MONGODB_URI
    return
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const mongo = await MongoMemoryServer.create()
  uri = mongo.getUri()
  stop = async () => void (await mongo.stop())
})
after(() => stop())

test('upgrades an older database once, keeping admin-created content', async () => {
  const dbName = `ihe_migration_test_${Date.now()}`
  const seedClient = new MongoClient(uri)
  await seedClient.connect()
  const old = seedClient.db(dbName)
  // Fleet & Equipment era
  await old.collection('equipment').insertOne({ _id: 1 as never, name: 'Scania Heavy Tipper Trucks' })
  await old.collection('counters').insertOne({ _id: 'equipment' as never, seq: 4 })
  await old.collection('activity').insertMany([
    { _id: 1 as never, kind: 'equipment', title: 'Equipment added', detail: 'x', createdAt: '2026-09-01T00:00:00Z' },
    { _id: 2 as never, kind: 'blog', title: 'Blog post published', detail: 'y', createdAt: '2026-09-02T00:00:00Z' },
  ])
  await old.collection('users').insertOne({
    _id: 1 as never,
    email: 'a@example.com',
    notificationPrefs: { newEnquiry: true, weeklySummary: true, projectStatus: false, equipmentStatus: false, systemAlerts: true },
  })
  // Previous website sample content, plus one project an admin added
  await old.collection('projects').insertMany([
    { _id: 1 as never, slug: 'ashghal-highway-logistics', title: 'Raw Materials Supply & Highway Logistics' },
    { _id: 2 as never, slug: 'pipeline-backfilling', title: 'Site Backfilling & Materials Transport Logistics' },
    { _id: 3 as never, slug: 'admin-added-project', title: 'Admin Added Project' },
  ])
  await old.collection('counters').insertOne({ _id: 'projects' as never, seq: 3 })
  await old.collection('services').insertOne({ _id: 1 as never, slug: 'road-asphalt', title: 'Road & Asphalt Works' })
  await old.collection('counters').insertOne({ _id: 'services' as never, seq: 1 })
  await old.collection('settings').insertOne({
    _id: 'company' as never,
    value: { companyName: 'International Heavy Equipment', companyEmail: 'info@ihe-qa.com', companyPhone: '', timezone: '', companyAddress: 'Custom address kept', logoUrl: null },
  })

  const { client, db } = await connectDatabase(uri, dbName)
  try {
    await runMigrations(db)

    const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
    assert.ok(!names.includes('equipment'), 'equipment collection dropped')
    assert.equal(await db.collection('counters').countDocuments({ _id: 'equipment' as never }), 0)
    assert.deepEqual(await db.collection('activity').distinct('kind'), ['blog'], 'equipment activity removed, other history kept')
    const prefs = (await db.collection('users').findOne({ _id: 1 as never }))!.notificationPrefs
    assert.equal(prefs.equipmentStatus, undefined)
    assert.equal(prefs.contentUpdates, false, 'preference value carried over under its new name')

    const projectSlugs = await db.collection('projects').distinct('slug')
    assert.ok(!projectSlugs.includes('ashghal-highway-logistics') && !projectSlugs.includes('pipeline-backfilling'), 'old sample projects removed')
    assert.ok(projectSlugs.includes('admin-added-project'), 'admin-created project kept')
    assert.equal(projectSlugs.length, seedProjects.length + 1)
    const lusail = await db.collection('projects').findOne({ slug: 'lusail-sports-circuit-roads' })
    assert.equal(lusail!.valueQar, 550_000_000)
    assert.equal(lusail!.status, 'current')
    assert.equal((await db.collection('projects').findOne({ slug: 'riw-northern-areas-phase-5' }))!.endDate, '2024')

    assert.deepEqual((await db.collection('services').find().sort({ sortOrder: 1 }).toArray()).map((s) => s.slug), seedServices.map((s) => s.id))
    assert.equal(await db.collection('certificates').countDocuments(), seedCertificates.length)

    const company = (await db.collection('settings').findOne({ _id: 'company' as never }))!.value
    assert.equal(company.companyName, 'International Heavy Equipment Transport and Contracting W.L.L.')
    assert.equal(company.companyAddress, 'Custom address kept', 'customised settings are not overwritten')

    // Running again (next server start) must not touch anything.
    await db.collection('activity').insertOne({ _id: 3 as never, kind: 'service', title: 'Service added', detail: 'z', createdAt: '2026-09-28T00:00:00Z' })
    await db.collection('certificates').deleteMany({})
    await runMigrations(db)
    assert.equal(await db.collection('activity').countDocuments(), 2)
    assert.equal(await db.collection('certificates').countDocuments(), 0, 'deleted certificates are not re-created')
  } finally {
    await db.dropDatabase()
    await client.close()
    await seedClient.close()
  }
})
