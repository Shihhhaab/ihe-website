import { createApp } from './app.ts'
import { loadConfig } from './config.ts'
import { connectDatabase } from './db/database.ts'
import { runMigrations } from './db/migrations.ts'
import { seed } from './db/seed.ts'

const config = loadConfig()
const { client, db } = await connectDatabase(config.mongoUri, config.mongoDbName)
await runMigrations(db)
await seed(db, config)

const server = createApp(db, config).listen(config.port, () => {
  console.log(`I.H.E. API listening on http://localhost:${config.port} (${config.env})`)
  console.log(`Database: MongoDB "${config.mongoDbName}" on ${new URL(config.mongoUri).host}`)
})

function shutdown() {
  server.close(async () => {
    await client.close()
    process.exit(0)
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
