import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const API_TARGET = process.env.API_URL ?? 'http://localhost:4000'

// Keep the browser's Host header so the API's same-origin check (CSRF defence)
// sees the request as coming from this dev server.
const apiProxy = { '/api': { target: API_TARGET, changeOrigin: false } }

/**
 * The admin panel is a separate single-page app served from /admin/.
 * In dev, route deep links such as /admin/enquiries to its HTML entry.
 */
function adminSpaFallback(): Plugin {
  return {
    name: 'admin-spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? ''
        const isPage = url === '/admin' || (url.startsWith('/admin/') && !/\.[a-z0-9]+(\?.*)?$/i.test(url.split('?')[0]))
        if (isPage && (req.headers.accept ?? '').includes('text/html')) req.url = '/admin/index.html'
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  root: 'frontend',
  publicDir: '../public',
  plugins: [react(), adminSpaFallback()],
  server: {
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        user: resolve(import.meta.dirname, 'frontend/index.html'),
        admin: resolve(import.meta.dirname, 'frontend/admin/index.html'),
      },
    },
  },
})
