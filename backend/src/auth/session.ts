import { createHash, randomBytes } from 'node:crypto'
import type { Request, RequestHandler, Response } from 'express'
import { canAccess, type Area } from '../../../shared/constants.ts'
import type { AdminUser } from '../../../shared/types.ts'
import type { Config } from '../config.ts'
import type { Db } from '../db/database.ts'
import { sessions } from '../db/repositories.ts'
import { forbidden, HttpError } from '../http/errors.ts'

/*
 * Cookie sessions: the browser holds a random 256-bit token in an httpOnly,
 * SameSite=Lax cookie; the database stores only its SHA-256 hash. Sessions
 * slide forward on use and are revoked on logout, password change or when a
 * user is deactivated.
 */

export const SESSION_COOKIE = 'ihe_admin_session'

export interface AuthContext {
  user: AdminUser
  sessionId: number
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie
  if (!header) return null
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

export function sessionManager(db: Db, config: Config) {
  const repo = sessions(db)
  const ttlMs = config.sessionTtlDays * 24 * 60 * 60 * 1000
  const expiry = () => new Date(Date.now() + ttlMs)

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: config.env === 'production',
    path: '/',
  }

  return {
    async start(res: Response, req: Request, userId: number) {
      const token = randomBytes(32).toString('base64url')
      await repo.create(hashToken(token), userId, req.get('user-agent')?.slice(0, 300) ?? null, expiry())
      res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: ttlMs })
    },

    async end(res: Response, auth: AuthContext | null) {
      if (auth) await repo.remove(auth.sessionId)
      res.clearCookie(SESSION_COOKIE, cookieOptions)
    },

    /** Resolves the session cookie into `res.locals.auth` (or null). Never rejects the request itself. */
    load: (async (req, res, next) => {
      res.locals.auth = null
      const token = readCookie(req, SESSION_COOKIE)
      if (!token) return next()
      const found = await repo.find(hashToken(token))
      if (!found || found.expiresAt <= new Date() || found.user.status !== 'active') {
        if (found) await repo.remove(found.sessionId)
        res.clearCookie(SESSION_COOKIE, cookieOptions)
        return next()
      }
      // Slide the expiry forward at most once a minute to limit writes.
      if (Date.now() - Date.parse(found.lastSeenAt) > 60_000) await repo.touch(found.sessionId, expiry())
      res.locals.auth = { user: found.user, sessionId: found.sessionId } satisfies AuthContext
      next()
    }) as RequestHandler,
  }
}

export function getAuth(res: Response): AuthContext {
  const auth = res.locals.auth as AuthContext | null
  if (!auth) throw new HttpError(401, 'Please sign in to continue.')
  return auth
}

export const requireAuth: RequestHandler = (_req, res, next) => {
  getAuth(res)
  next()
}

/** Restricts a router to roles that can access the given admin area. */
export const requireArea =
  (area: Area): RequestHandler =>
  (_req, res, next) => {
    if (!canAccess(getAuth(res).user.role, area)) throw forbidden()
    next()
  }
