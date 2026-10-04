import { MotionConfig } from 'motion/react'
import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import HomePage from './pages/Home/HomePage'

const AboutPage = lazy(() => import('./pages/About/AboutPage'))
const ServicesPage = lazy(() => import('./pages/Services/ServicesPage'))
const ProjectsPage = lazy(() => import('./pages/Projects/ProjectsPage'))
const BlogsPage = lazy(() => import('./pages/Blogs/BlogsPage'))
const BlogDetailPage = lazy(() => import('./pages/Blogs/BlogDetailPage'))
const ContactPage = lazy(() => import('./pages/Contact/ContactPage'))
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'))

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/services', element: <ServicesPage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/blogs', element: <BlogsPage /> },
      { path: '/blogs/:slug', element: <BlogDetailPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  )
}
