import { AnimatePresence, motion } from 'motion/react'
import { HardHat, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '../../components/buttons/Button'
import { Img } from '../../components/ui/Img'
import type { Project } from '../../data/projects'
import { EASE_IN_OUT, EASE_OUT } from '../../lib/motion'

interface ProjectDialogProps {
  project: Project | null
  onClose: () => void
}

/** Slide-in project sheet with the full record for the selected project. */
export function ProjectDialog({ project, onClose }: ProjectDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!project) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.classList.add('is-locked')
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('is-locked')
      window.removeEventListener('keydown', onKey)
      previouslyFocused?.focus()
    }
  }, [project, onClose])

  return (
    <AnimatePresence>
      {project && (
        <motion.div className="project-dialog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="project-dialog__backdrop" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-dialog-title"
            className="project-dialog__panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.7, ease: EASE_IN_OUT }}
          >
            <button ref={closeRef} type="button" className="project-dialog__close" onClick={onClose} aria-label="Close project details">
              <X size={20} strokeWidth={1.5} />
            </button>
            <motion.div
              className="project-dialog__media"
              initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
              animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
              transition={{ duration: 1, ease: EASE_IN_OUT, delay: 0.3 }}
            >
              {project.image ? (
                <Img name={project.image} alt={project.imageAlt} sizes="(max-width: 700px) 100vw, 640px" />
              ) : (
                <span className="project-card__placeholder" aria-hidden="true">
                  <HardHat size={40} strokeWidth={1.1} />
                  <span className="mono">{project.client}</span>
                </span>
              )}
            </motion.div>
            <motion.div
              className="project-dialog__body"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.5 }}
            >
              <div className="project-card__meta mono">
                <span className={`status status--${project.status.toLowerCase()}`}>{project.status}</span>
                {project.period && <span>{project.period}</span>}
              </div>
              <h2 id="project-dialog-title" className="h3">
                {project.title}
              </h2>
              <p className="lead muted">{project.summary}</p>
              <dl className="project-dialog__facts">
                <div>
                  <dt className="mono">Client entity</dt>
                  <dd>{project.client}</dd>
                </div>
                {project.scope && (
                  <div>
                    <dt className="mono">Scope of work</dt>
                    <dd>{project.scope}</dd>
                  </div>
                )}
                <div>
                  <dt className="mono">Location</dt>
                  <dd>{project.location}</dd>
                </div>
                {project.value && project.value !== '—' && (
                  <div>
                    <dt className="mono">Contract value</dt>
                    <dd className="accent">{project.value}</dd>
                  </div>
                )}
              </dl>
              <Button to="/contact">Discuss a similar project</Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
