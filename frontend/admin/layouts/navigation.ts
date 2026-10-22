import {
  Award,
  CheckCircle2,
  ClipboardList,
  HardHat,
  LayoutGrid,
  MessageSquareText,
  Newspaper,
  PanelTop,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Area } from '../../../shared/constants'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** `null` = every signed-in admin (e.g. their own settings). */
  area: Area | null
}

export const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutGrid, area: 'dashboard' },
      { label: 'Enquiries', to: '/enquiries', icon: MessageSquareText, area: 'enquiries' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Website Header', to: '/header', icon: PanelTop, area: 'header' },
      { label: 'Blogs', to: '/blogs', icon: Newspaper, area: 'blogs' },
      { label: 'Certificates', to: '/certificates', icon: Award, area: 'certificates' },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Current Projects', to: '/projects/current', icon: HardHat, area: 'projects' },
      { label: 'Completed Projects', to: '/projects/completed', icon: CheckCircle2, area: 'projects' },
      { label: 'Services', to: '/services', icon: ClipboardList, area: 'services' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users', to: '/users', icon: Users, area: 'users' },
      { label: 'Settings', to: '/settings', icon: Settings, area: null },
    ],
  },
]
