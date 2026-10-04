import { existsSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import { requireAuth, sessionManager } from './auth/session.ts'
import type { Config } from './config.ts'
import type { Db } from './db/database.ts'
import { apiNotFound, errorHandler } from './http/errors.ts'
import { sameOriginWrites, securityHeaders } from './http/security.ts'
import { cloudinaryStore, type MediaStore } from './media/storage.ts'
import { authRoutes } from './routes/auth.ts'
import { blogRoutes, certificateRoutes, enquiryRoutes, projectRoutes, serviceRoutes } from './routes/admin/content.ts'
import { overviewRoutes, settingsRoutes, uploadRoutes, userRoutes } from './routes/admin/system.ts'
import { publicRoutes } from './routes/public.ts'

/**
 * Builds the HTTP application:
 *
 *   /api/public/*  website content + contact form (no auth)
 *   /api/auth/*    admin sign-in / sign-out / current user
 *   /api/admin/*   admin panel API (session + role checks)
 *   (uploaded images are stored on and served by Cloudinary)
 *   /admin/*       admin SPA   ┐ served from dist/ after `npm run build`
 *   /*             public SPA  ┘
 */
export function createApp(
  db: Db,
  config: Config,
  log: (err: unknown) => void = console.error,
  /** Image storage; defaults to Cloudinary from config. Tests pass an in-memory stand-in. */
  media: MediaStore | null = config.cloudinary ? cloudinaryStore(config.cloudinary) : null,
) {
  const app = express()
  const sessions = sessionManager(db, config)

  app.disable('x-powered-by')
  app.set('trust proxy', 'loopback, linklocal, uniquelocal')
  app.use(securityHeaders)

  /* ─── API ─── */
  const api = express.Router()
  api.use(sameOriginWrites(config.allowedOrigins))
  api.use(sessions.load)
  api.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    next()
  })
  // Registered before the default JSON parser because it accepts larger bodies.
  api.use('/admin/uploads', requireAuth, uploadRoutes(media, log))
  api.use(express.json({ limit: '200kb' }))

  api.use('/public', publicRoutes(db))
  api.use('/auth', authRoutes(db, sessions))

  const admin = express.Router()
  admin.use(requireAuth)
  admin.use('/', overviewRoutes(db))
  admin.use('/enquiries', enquiryRoutes(db))
  admin.use('/blogs', blogRoutes(db, media, log))
  admin.use('/projects', projectRoutes(db, media, log))
  admin.use('/services', serviceRoutes(db, media, log))
  admin.use('/certificates', certificateRoutes(db, media, log))
  admin.use('/users', userRoutes(db, media, log))
  admin.use('/settings', settingsRoutes(db, media, log))
  api.use('/admin', admin)

  api.use(apiNotFound)
  api.use(errorHandler(log))
  app.use('/api', api)

  /* ─── Built frontends (production) ─── */
  if (existsSync(path.join(config.distDir, 'index.html'))) {
    app.use(express.static(config.distDir, { index: false, redirect: false, maxAge: '1h' }))
    // Missing files (e.g. /img/old.webp) are real 404s, not the app shell.
    app.get(/\.[a-z0-9]+$/i, (_req, res) => {
      res.status(404).end()
    })
    app.get(/^\/admin(\/.*)?$/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache')
      res.sendFile(path.join(config.distDir, 'admin', 'index.html'))
    })
    app.get(/.*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache')
      res.sendFile(path.join(config.distDir, 'index.html'))
    })
  }

  return app
}
