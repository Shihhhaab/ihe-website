import { ArrowUpRight, HardHat, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Project } from '../../data/projects'
import { Img } from '../ui/Img'
import './cards.css'

interface ProjectCardProps {
  project: Project
  index: number
  variant?: 'feature' | 'standard'
  sizes?: string
  onOpen?: (project: Project) => void
  href?: string
}

/**
 * Project tile: cinematic image with zoom-on-hover, status and period metadata.
 * Renders as a button when `onOpen` is provided, otherwise as a link.
 */
export function ProjectCard({ project, index, variant = 'standard', sizes, onOpen, href }: ProjectCardProps) {
  const body = (
    <>
      <div className="project-card__media">
        {project.image ? (
          <Img name={project.image} alt={project.imageAlt} sizes={sizes ?? '(max-width: 900px) 100vw, 50vw'} />
        ) : (
          // No photograph for this project yet: an engineering-grid placeholder instead of an unrelated photo.
          <span className="project-card__placeholder" aria-hidden="true">
            <HardHat size={34} strokeWidth={1.1} />
            <span className="mono">{project.client}</span>
          </span>
        )}
        <span className="project-card__shade" aria-hidden="true" />
        <span className="project-card__index mono" aria-hidden="true">
          P—{String(index + 1).padStart(2, '0')}
        </span>
        <span className="project-card__go" aria-hidden="true">
          <ArrowUpRight size={20} strokeWidth={1.5} />
        </span>
      </div>
      <div className="project-card__body">
        <div className="project-card__meta mono">
          <span className={`status status--${project.status.toLowerCase()}`}>{project.status}</span>
          {project.period && <span>{project.period}</span>}
        </div>
        <h3 className="project-card__title">{project.title}</h3>
        <p className="project-card__client">{project.client}</p>
        <div className="project-card__foot mono">
          <span>
            <MapPin size={13} strokeWidth={1.75} aria-hidden="true" /> {project.location}
          </span>
          {project.value && project.value !== '—' && <span className="project-card__value">{project.value}</span>}
        </div>
      </div>
    </>
  )

  const className = `project-card project-card--${variant}`
  if (onOpen) {
    return (
      <button type="button" className={className} onClick={() => onOpen(project)} aria-haspopup="dialog">
        {body}
      </button>
    )
  }
  return (
    <Link to={href ?? `/projects#${project.id}`} className={className}>
      {body}
    </Link>
  )
}
