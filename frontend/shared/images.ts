import { cloudinaryUrl } from '../../shared/cloudinary'
import manifest from './imageManifest.json'

type LibraryKey = keyof typeof manifest

export const isLibraryImage = (ref: string): ref is LibraryKey => Object.hasOwn(manifest, ref)

/** Bundled photography offered in the admin photo library (certificate scans are excluded). */
export const libraryImages = (Object.keys(manifest) as LibraryKey[]).filter((key) => !key.endsWith('-certificate'))

/** A small preview URL for any image reference (library key or uploaded file). */
export function previewUrl(ref: string | null | undefined): string | null {
  if (!ref) return null
  if (!isLibraryImage(ref)) return cloudinaryUrl(ref, 640)
  return `/img/${ref}-${manifest[ref].widths[0]}.webp`
}

/** The full-size URL of an image or document (e.g. to open a certificate in a new tab). */
export function fullUrl(ref: string): string {
  if (!isLibraryImage(ref)) return ref
  const { widths } = manifest[ref]
  return `/img/${ref}-${widths[widths.length - 1]}.webp`
}
