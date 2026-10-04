import { MongoClient, type Db as MongoDb } from 'mongodb'

export type Db = MongoDb

export interface Database {
  client: MongoClient
  db: Db
}

/**
 * Connects to MongoDB and makes sure every collection has its indexes.
 * Run `runMigrations` (db/migrations.ts) and then `seed` after connecting.
 */
export async function connectDatabase(uri: string, dbName: string): Promise<Database> {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000, appName: 'ihe-website' })
  await client.connect()
  const db = client.db(dbName)
  await ensureIndexes(db)
  return { client, db }
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ userId: 1 }),
    // MongoDB deletes sessions automatically once `expiresAt` has passed.
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('enquiries').createIndex({ createdAt: -1 }),
    db.collection('enquiries').createIndex({ status: 1 }),
    db.collection('blogs').createIndex({ slug: 1 }, { unique: true }),
    db.collection('blogs').createIndex({ status: 1, publishDate: -1 }),
    db.collection('projects').createIndex({ slug: 1 }, { unique: true }),
    db.collection('projects').createIndex({ status: 1 }),
    db.collection('services').createIndex({ slug: 1 }, { unique: true }),
    db.collection('services').createIndex({ visible: 1, sortOrder: 1 }),
    db.collection('certificates').createIndex({ visible: 1, sortOrder: 1 }),
    db.collection('activity').createIndex({ createdAt: -1 }),
  ])
}

/**
 * Sequential numeric ids (kept from the original schema so URLs and
 * references like ENQ-1001 stay short and readable).
 */
export async function nextId(db: Db, name: string): Promise<number> {
  const counter = await db
    .collection<{ _id: string; seq: number }>('counters')
    .findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })
  return counter!.seq
}

export const now = () => new Date().toISOString()
