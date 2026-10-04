import type { ImgHTMLAttributes } from 'react'
import { imageSource } from '../../data/images'

interface ImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  /** Bundled image key or uploaded image URL. */
  name: string
  alt: string
  priority?: boolean
}

export function Img({ name, alt, priority = false, sizes = '100vw', ...rest }: ImgProps) {
  const { src, srcSet, width, height } = imageSource(name)
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      {...rest}
    />
  )
}
