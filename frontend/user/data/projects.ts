// Project content lives in /shared so the backend can seed the database from it.
// It is also the website's offline fallback when the API is unavailable.
export type { PublicProject as Project, PublicProjectStatus as ProjectStatus } from '../../../shared/types'
export { seedProjects as projects } from '../../../shared/content/projects'
