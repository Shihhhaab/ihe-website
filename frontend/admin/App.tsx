import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider } from './components/Toast'
import { AdminLayout, RequireArea } from './layouts/AdminLayout'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

const EnquiriesPage = lazy(() => import('./pages/EnquiriesPage'))
const BlogsPage = lazy(() => import('./pages/BlogsPage'))
const HeaderPage = lazy(() => import('./pages/HeaderPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

const PageLoading = () => <div className="skeleton" style={{ height: 240 }} aria-busy="true" aria-label="Loading" />

const page = (node: ReactNode) => <Suspense fallback={<PageLoading />}>{node}</Suspense>

// Every route lives under /admin (see vite.config.ts and the backend's SPA fallback).
const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage /> },
    {
      element: <AdminLayout />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'dashboard', element: <Navigate to="/" replace /> },
        { path: 'enquiries', element: page(<RequireArea area="enquiries"><EnquiriesPage /></RequireArea>) },
        { path: 'header', element: page(<RequireArea area="header"><HeaderPage /></RequireArea>) },
        { path: 'blogs', element: page(<RequireArea area="blogs"><BlogsPage /></RequireArea>) },
        { path: 'projects', element: <Navigate to="/projects/current" replace /> },
        // The Pending Projects page was removed; old links land on Current Projects.
        { path: 'projects/pending', element: <Navigate to="/projects/current" replace /> },
        { path: 'projects/:status', element: page(<RequireArea area="projects"><ProjectsPage /></RequireArea>) },
        { path: 'services', element: page(<RequireArea area="services"><ServicesPage /></RequireArea>) },
        { path: 'certificates', element: page(<RequireArea area="certificates"><CertificatesPage /></RequireArea>) },
        { path: 'users', element: page(<RequireArea area="users"><UsersPage /></RequireArea>) },
        { path: 'settings', element: page(<SettingsPage />) },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: '/admin' },
)

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  )
}
