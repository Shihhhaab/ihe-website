# I.H.E. — International Heavy Equipment

One project containing the public website, the admin panel and the backend API.

```
Public website (/)  ──┐
                      ├──►  Backend API (/api)  ──►  MongoDB (Atlas)
Admin panel (/admin) ─┘
```

**Stack:** React 19 + TypeScript + Vite (both frontends) · Node.js + Express 5 (API) · MongoDB (official `mongodb` driver) · Motion (public-site animation). Requires **Node 22.18+** (the backend runs TypeScript directly with Node's type stripping).

## Getting started

```bash
npm install
cp .env.example .env        # then set ADMIN_EMAIL and ADMIN_PASSWORD
npm run dev                 # API on :4000 + Vite on :5173
```

- Website: http://localhost:5173/
- Admin: http://localhost:5173/admin/ (sign in with the ADMIN_EMAIL / ADMIN_PASSWORD from `.env`)

On first start the MongoDB database (`MONGODB_DB`, default `ihe`) is seeded with the website's existing projects, blog posts, services and company details (certificates are added in the admin panel). The first super admin is created from `.env` only when no admin users exist.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API (auto-restarts on backend/shared changes) + Vite dev server with `/api` proxy |
| `npm run dev:web` / `npm run dev:api` | Run either half on its own |
| `npm run build` | Type-check everything, then build both frontends to `dist/` |
| `npm start` | Production: one Node process serves the API and `dist/` (website + admin) on `PORT` |
| `npm test` | Backend integration tests (throwaway in-memory MongoDB — never touches your real database) |
| `npm run typecheck` / `npm run lint` | TypeScript (frontend, backend, config) / oxlint |
| `npm run check:cloudinary` | Uploads, fetches and deletes a sample image to verify the Cloudinary settings |
| `npm run images` | Regenerate optimised WebP images from `assets-src/` |

## Project layout

```
frontend/
  index.html          public website entry  → /
  user/               public website (pages, components, animations, styles)
  admin/              admin panel (index.html → /admin/, pages, layouts, components, hooks)
  shared/             frontend-only shared code: API client, image manifest
backend/
  src/server.ts       entry point
  src/app.ts          routes: /api/public, /api/auth, /api/admin, SPA fallbacks
  src/db/             MongoDB connection + indexes, repositories, first-run seed
  src/auth/           password hashing (scrypt), cookie sessions, role guards
  src/routes/         public, auth and admin endpoints
  src/media/          Cloudinary image storage (upload + cleanup of replaced images)
  src/http/           errors, security headers, CSRF origin check, rate limiting
  tests/              API integration tests
shared/               code used by frontends AND backend: types, validation, constants, formatting, seed content
public/               static assets (images, favicon) shared by both frontends
```

The website and the admin panel are separate Vite entries, so each loads only its own CSS and JavaScript.

## Authentication & roles

Admins sign in at `/admin/login`. Sessions use a random token in an httpOnly, SameSite=Lax cookie (Secure in production); only its SHA-256 hash is stored. Passwords are hashed with scrypt. Sign-in is rate-limited; writes must be same-origin JSON.

| Role | Access |
| --- | --- |
| Super Admin | Everything, including Users and company settings |
| Content Manager | Dashboard, Blogs, Certificates, Projects, Services |
| Enquiry Manager | Dashboard, Enquiries |

Every admin can edit their own profile, password, sessions and notification preferences. Permissions are enforced by the API; the UI only hides what a role can't use.

## How the website uses the API

Blogs, projects, services, certificates (About page, above the footer), the home page header (admin → Website Header) and the contact form talk to `/api/public`. Pages render the bundled content instantly and swap in live data when it arrives. If the API is unreachable (e.g. a static-only deploy), the bundled content stays and the contact form falls back to opening the visitor's email client.

## Deployment

Run `npm run build && npm start` on any Node host — no persistent disk is needed: data lives in MongoDB (`MONGODB_URI`) and uploaded images in Cloudinary (`CLOUDINARY_*`). Add the host's IP to Atlas → Network Access. Set `NODE_ENV=production`. `vercel.json` is kept for static-only hosting of the website, but the admin panel and contact form need the Node server.
