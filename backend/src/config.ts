import path from 'node:path'

/*
 * Runtime configuration, read from environment variables.
 * `npm run dev`, `npm run dev:api` and `npm start` load a local `.env` file if one
 * exists (see .env.example for every variable).
 */

const root = path.resolve(import.meta.dirname, '../..')

function int(name: string, fallback: number) {
  const raw = process.env[name]
  const n = raw ? Number(raw) : fallback
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number`)
  return n
}

export interface Config {
  env: 'development' | 'production' | 'test'
  port: number
  /** MongoDB connection string (e.g. MongoDB Atlas `mongodb+srv://…`). */
  mongoUri: string
  /** Database name inside the cluster. */
  mongoDbName: string
  /** Cloudinary account for uploaded images; null disables uploads (the rest of the site still works). */
  cloudinary: CloudinaryConfig | null
  distDir: string
  sessionTtlDays: number
  /** Extra origins allowed to make state-changing requests (CSRF defence). The API's own host is always allowed. */
  allowedOrigins: string[]
  /** Creates the first super admin when the database has no users. */
  initialAdmin: { name: string; email: string; password: string } | null
}

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
  /** Root folder in the Cloudinary media library, e.g. "ihe". */
  folder: string
}

function loadCloudinary(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()
  const set = [cloudName, apiKey, apiSecret].filter(Boolean).length
  if (set === 0) return null
  if (set < 3) throw new Error('Cloudinary is partly configured. Set all of CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET (see .env.example).')
  const folder = (process.env.CLOUDINARY_FOLDER?.trim() || 'ihe').replace(/^\/+|\/+$/g, '')
  return { cloudName: cloudName!, apiKey: apiKey!, apiSecret: apiSecret!, folder }
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const env = (process.env.NODE_ENV as Config['env'] | undefined) ?? 'development'
  const email = process.env.ADMIN_EMAIL?.trim()
  const password = process.env.ADMIN_PASSWORD
  const config: Config = {
    env,
    port: int('PORT', 4000),
    mongoUri: process.env.MONGODB_URI?.trim() ?? '',
    mongoDbName: process.env.MONGODB_DB?.trim() || 'ihe',
    cloudinary: 'cloudinary' in overrides ? null : loadCloudinary(),
    distDir: path.resolve(root, 'dist'),
    sessionTtlDays: int('SESSION_TTL_DAYS', 7),
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    initialAdmin: email && password ? { name: process.env.ADMIN_NAME?.trim() || 'Administrator', email, password } : null,
    ...overrides,
  }
  if (!config.mongoUri) throw new Error('MONGODB_URI is not set. Add your MongoDB connection string to .env (see .env.example).')
  return config
}
