const MARKER = '/image/upload/'

export const isCloudinaryUrl = (url: string) => url.startsWith('https://res.cloudinary.com/')

export const isPdf = (url: string) => /\.pdf$/i.test(url)

/**
 * Adds Cloudinary delivery transformations to an uploaded image URL:
 * automatic format (WebP/AVIF where supported), automatic quality, and an
 * optional width. Non-Cloudinary URLs are returned unchanged.
 *
 *   cloudinaryUrl('https://res.cloudinary.com/x/image/upload/v1/ihe/a.jpg', 640)
 *   → 'https://res.cloudinary.com/x/image/upload/f_auto,q_auto,c_limit,w_640/v1/ihe/a.jpg'
 *
 * PDFs are turned into an image of their first page, so certificate scans
 * uploaded as PDF can be previewed like any other image.
 */
export function cloudinaryUrl(url: string, width?: number): string {
  const at = url.indexOf(MARKER)
  if (!isCloudinaryUrl(url) || at < 0) return url
  const pdf = isPdf(url)
  const transform = [...(pdf ? ['pg_1'] : []), 'f_auto', 'q_auto', ...(width ? ['c_limit', `w_${width}`] : [])].join(',')
  const path = url.slice(at + MARKER.length)
  return `${url.slice(0, at + MARKER.length)}${transform}/${pdf ? path.replace(/\.pdf$/i, '.jpg') : path}`
}
