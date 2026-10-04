import { randomUUID } from 'node:crypto'
import { v2 as cloudinary } from 'cloudinary'
import type { CloudinaryConfig } from '../config.ts'

/*
 * Where admin-uploaded images live. Production uses Cloudinary; tests pass an
 * in-memory stand-in so they never touch the real account.
 */

/** Sub-folders inside the configured Cloudinary folder, one per kind of image. */
export const MEDIA_FOLDERS = ['blogs', 'projects', 'services', 'certificates', 'branding', 'avatars'] as const
export type MediaFolder = (typeof MEDIA_FOLDERS)[number]

/** PDFs are only accepted for certificate scans. */
export type MediaFormat = 'png' | 'jpg' | 'webp' | 'pdf'

const MIME: Record<MediaFormat, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf' }

export interface MediaStore {
  /** Stores a validated image and returns its public HTTPS URL. */
  upload(file: Buffer, folder: MediaFolder, format: MediaFormat): Promise<string>
  /** Deletes a previously uploaded image. Ignores URLs this store didn't create. */
  remove(url: string): Promise<void>
}

export function cloudinaryStore(config: CloudinaryConfig): MediaStore {
  cloudinary.config({ cloud_name: config.cloudName, api_key: config.apiKey, api_secret: config.apiSecret, secure: true })
  const prefix = `https://res.cloudinary.com/${config.cloudName}/image/upload/`

  /** "https://res.cloudinary.com/<cloud>/image/upload/v123/ihe/blogs/abc.jpg" → "ihe/blogs/abc" */
  const publicIdOf = (url: string) => {
    if (!url.startsWith(prefix)) return null
    const id = url
      .slice(prefix.length)
      .replace(/^v\d+\//, '')
      .replace(/\.[a-z0-9]+$/i, '')
    return id.startsWith(`${config.folder}/`) ? id : null
  }

  return {
    async upload(file, folder, format) {
      // PDFs are stored as 'image' resources so Cloudinary can render page previews.
      const result = await cloudinary.uploader.upload(`data:${MIME[format]};base64,${file.toString('base64')}`, {
        resource_type: 'image',
        folder: `${config.folder}/${folder}`,
        public_id: randomUUID(),
        overwrite: false,
        allowed_formats: [format],
      })
      return result.secure_url
    },
    async remove(url) {
      const publicId = publicIdOf(url)
      if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true })
    },
  }
}

/**
 * Deletes the old image when a record's image is replaced or the record is
 * removed. Best-effort: a failed cleanup never blocks the admin's change.
 */
export function discardReplaced(media: MediaStore | null, previous: string | null | undefined, next: string | null | undefined, log: (err: unknown) => void) {
  if (!media || !previous || previous === next) return
  media.remove(previous).catch(log)
}
