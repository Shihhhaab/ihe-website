/*
 * Minimal JSON client for the backend API, shared by the public site and the
 * admin panel. Requests are same-origin (Vite proxies /api in development),
 * so the admin session cookie is sent automatically.
 */
import type { ApiError as ApiErrorBody } from '../../shared/types'

export class ApiError extends Error {
  status: number
  fields: Record<string, string>

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

/** Fired on any 401 so the admin app can return to the sign-in screen. */
export const UNAUTHORIZED_EVENT = 'ihe:unauthorized'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function api<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.')
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // A non-JSON body (e.g. an HTML page or a static host's 405) means the API isn't running behind this host.
    throw new ApiError(502, 'The server returned an unexpected response.')
  }

  if (!res.ok) {
    const err = (data ?? {}) as Partial<ApiErrorBody>
    if (res.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new ApiError(res.status, err.error ?? `Request failed (${res.status}).`, err.fields)
  }
  return data as T
}
