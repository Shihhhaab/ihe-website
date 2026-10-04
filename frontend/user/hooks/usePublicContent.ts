import { useEffect, useState } from 'react'
import type { PublicBlogPost, PublicCertificate, PublicProject, PublicService } from '../../../shared/types'
import { api } from '../../shared/api'
import { blogPosts } from '../data/blogs'
import { projects } from '../data/projects'
import { services } from '../data/services'

/*
 * Live website content from the backend (managed in the admin panel).
 *
 * Pages render the bundled content instantly, then switch to the API's data
 * once it arrives. If the API can't be reached, the bundled content simply
 * stays — so the site still works when deployed without the backend.
 * Responses are cached for the session so page transitions don't refetch.
 */

const cache = new Map<string, { value?: unknown; promise: Promise<unknown> }>()

function load<T>(path: string): Promise<T> {
  let entry = cache.get(path)
  if (!entry) {
    const promise = api<T>(`/public${path}`).then((value) => {
      entry!.value = value
      return value
    })
    // Allow a retry on the next page view if this request fails.
    promise.catch(() => cache.delete(path))
    entry = { promise }
    cache.set(path, entry)
  }
  return entry.promise as Promise<T>
}

function useLiveContent<T>(path: string, fallback: T) {
  const cached = cache.get(path)
  const [state, setState] = useState<{ data: T; settled: boolean }>(() =>
    cached && 'value' in cached ? { data: cached.value as T, settled: true } : { data: fallback, settled: false },
  )

  useEffect(() => {
    if (state.settled) return
    let active = true
    load<T>(path)
      .then((data) => active && setState({ data, settled: true }))
      .catch(() => active && setState((s) => ({ ...s, settled: true })))
    return () => {
      active = false
    }
  }, [path, state.settled])

  return state
}

export const useBlogPosts = () => useLiveContent<PublicBlogPost[]>('/blogs', blogPosts)

export const useProjects = () => useLiveContent<PublicProject[]>('/projects', projects)

export const useServices = () => useLiveContent<PublicService[]>('/services', services)

/** Certificates exist only in the admin panel, so there is no bundled fallback. */
export const useCertificates = () => useLiveContent<PublicCertificate[]>('/certificates', [])

/** Sends the contact form to the backend. Returns the enquiry reference. */
export async function sendEnquiry(body: Record<string, string>) {
  return api<{ reference: string | null }>('/public/enquiries', { method: 'POST', body })
}
