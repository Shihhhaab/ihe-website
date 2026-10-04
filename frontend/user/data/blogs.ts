import { seedBlogPosts } from '../../../shared/content/blogs'
import type { PublicBlogPost } from '../../../shared/types'

// Posts are managed in the admin panel and served by the API (see hooks/usePublicContent).
// The seed content below is the offline fallback.
export type { BlogBlock, PublicBlogPost as BlogPost } from '../../../shared/types'

export const blogPosts = seedBlogPosts

export const categoriesOf = (posts: PublicBlogPost[]) => ['All', ...Array.from(new Set(posts.map((p) => p.category)))]

export const blogCategories = categoriesOf(blogPosts)

export const getPost = (slug: string) => blogPosts.find((p) => p.slug === slug)

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
