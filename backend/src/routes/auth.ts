import { Router } from 'express'
import type { Db } from '../db/database.ts'
import * as repo from '../db/repositories.ts'
import { DUMMY_HASH_PROMISE, verifyPassword } from '../auth/password.ts'
import { getAuth, type sessionManager } from '../auth/session.ts'
import { HttpError } from '../http/errors.ts'
import { rateLimit } from '../http/security.ts'

export function authRoutes(db: Db, sessions: ReturnType<typeof sessionManager>) {
  const router = Router()
  const users = repo.users(db)

  router.post(
    '/login',
    rateLimit({
      windowMs: 15 * 60_000,
      max: 8,
      message: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
      key: (req) => String(req.body?.email ?? '').toLowerCase(),
    }),
    async (req, res) => {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
      const password = typeof req.body?.password === 'string' ? req.body.password : ''
      if (!email || !password) throw new HttpError(400, 'Enter your email and password.')

      const found = await users.credentialsByEmail(email)
      // Always run a hash comparison so timing doesn't reveal whether the email exists.
      const ok = await verifyPassword(password, found?.passwordHash ?? (await DUMMY_HASH_PROMISE))
      if (!found || !ok) throw new HttpError(401, 'Incorrect email or password.')
      if (found.user.status !== 'active') throw new HttpError(403, 'This account has been deactivated. Contact a super admin.')

      // Expired sessions are removed by MongoDB's TTL index.
      await sessions.start(res, req, found.user.id)
      await users.touchLogin(found.user.id)
      res.json({ user: await users.byId(found.user.id) })
    },
  )

  router.post('/logout', async (_req, res) => {
    await sessions.end(res, res.locals.auth ?? null)
    res.status(204).end()
  })

  router.get('/me', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.json({ user: getAuth(res).user })
  })

  return router
}
