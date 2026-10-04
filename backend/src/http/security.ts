import type { RequestHandler } from 'express'
import { HttpError } from './errors.ts'

/** Conservative security headers for both API responses and served pages. */
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * CSRF defence for cookie-authenticated requests: state-changing requests must
 * be JSON and come from this site's own origin (or an explicitly allowed one).
 * Session cookies are also SameSite=Lax.
 */
export function sameOriginWrites(allowedOrigins: string[]): RequestHandler {
  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) return next()
    // Bodies must be JSON: HTML forms (the classic CSRF vector) can't send that cross-site without a preflight.
    const hasBody = Number(req.get('content-length') ?? 0) > 0 || req.get('transfer-encoding') !== undefined
    if (hasBody && !req.is('application/json')) return next(new HttpError(415, 'Requests must be sent as JSON.'))
    const origin = req.get('origin')
    if (origin) {
      const host = req.get('x-forwarded-host') ?? req.get('host')
      let sameHost = false
      try {
        sameHost = new URL(origin).host === host
      } catch {
        sameHost = false
      }
      if (!sameHost && !allowedOrigins.includes(origin)) return next(new HttpError(403, 'Cross-origin request blocked.'))
    }
    next()
  }
}

/** Fixed-window in-memory rate limiter, keyed by client IP plus an optional discriminator. */
export function rateLimit(opts: { windowMs: number; max: number; message: string; key?: (req: Parameters<RequestHandler>[0]) => string }): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return (req, res, next) => {
    const now = Date.now()
    if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
    const key = `${req.ip}|${opts.key?.(req) ?? ''}`
    const entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + opts.windowMs })
      return next()
    }
    entry.count += 1
    if (entry.count > opts.max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      return next(new HttpError(429, opts.message))
    }
    next()
  }
}
