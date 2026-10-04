// Services are managed in the admin panel (Services) and served by the API
// (see hooks/usePublicContent). The seed list in /shared is the offline fallback.
export type { PublicService as Service } from '../../../shared/types'
export { seedServices as services } from '../../../shared/content/services'
