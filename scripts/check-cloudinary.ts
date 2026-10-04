// Verifies the Cloudinary settings in .env: uploads a sample image through the
// app's media store, fetches it (original + resized), then deletes it again.
// Usage: node --env-file=.env scripts/check-cloudinary.ts
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { cloudinaryUrl } from '../shared/cloudinary.ts'
import { CLOUDINARY_IMAGE } from '../shared/validation.ts'
import { cloudinaryStore } from '../backend/src/media/storage.ts'

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET
if (!cloudName || !apiKey || !apiSecret) {
  console.error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env first.')
  process.exit(1)
}

const store = cloudinaryStore({ cloudName, apiKey, apiSecret, folder: process.env.CLOUDINARY_FOLDER?.trim() || 'ihe' })
const sample = readFileSync(path.resolve(import.meta.dirname, '../public/img/about-img-624.webp'))

const url = await store.upload(sample, 'branding', 'webp')
console.log('✓ uploaded          ', url)
console.log('✓ passes validation ', CLOUDINARY_IMAGE.test(url))

const original = await fetch(url)
console.log('✓ original served   ', original.status, original.headers.get('content-type'))
const resized = await fetch(cloudinaryUrl(url, 320), { headers: { accept: 'image/avif,image/webp,*/*' } })
console.log('✓ resized served    ', resized.status, resized.headers.get('content-type'), `${Number(resized.headers.get('content-length')) || '?'} bytes (original ${sample.length})`)

await store.remove(url)
console.log('✓ deleted from Cloudinary')
