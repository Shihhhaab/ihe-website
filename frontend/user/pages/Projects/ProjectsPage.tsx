import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { MaskImage } from '../../components/animations/MaskImage'
import { MaskLines } from '../../components/animations/MaskLines'
import { Reveal, RevealGroup, RevealItem } from '../../components/animations/Reveal'
import { Button } from '../../components/buttons/Button'
import { ProjectCard } from '../../components/cards/ProjectCard'
import { CtaBand } from '../../components/sections/CtaBand'
import { PageHero } from '../../components/sections/PageHero'
import { SectionHeader } from '../../components/sections/SectionHeader'
import { FilterTabs } from '../../components/ui/FilterTabs'
import type { Project, ProjectStatus } from '../../data/projects'
import { useProjects } from '../../hooks/usePublicContent'
import { usePageMeta } from '../../hooks/usePageMeta'
import { EASE_OUT } from '../../lib/motion'
import { ProjectDialog } from './ProjectDialog'
import './projects.css'

type Filter = 'All' | ProjectStatus
const filters: Filter[] = ['All', 'Ongoing', 'Completed']

export default function ProjectsPage() {
  usePageMeta(
    'Projects',
    'Raw materials supply, earthworks, asphalt pavement and backfilling projects delivered by I.H.E. across Doha, Lusail and Al Rayyan.',
  )
  const [filter, setFilter] = useState<Filter>('All')
  const [selected, setSelected] = useState<Project | null>(null)
  const closeDialog = useCallback(() => setSelected(null), [])

  const { data: projects } = useProjects()
  const countFor = (f: Filter) => (f === 'All' ? projects.length : projects.filter((p) => p.status === f).length)
  const feature = projects.find((p) => p.featured) ?? projects[0]
  const visible = projects.filter((p) => filter === 'All' || p.status === filter)

  return (
    <div className="page">
      <PageHero
        pageIndex="04 / 06"
        crumb="Projects"
        eyebrow="Our projects"
        title={['Project', 'experience']}
        accentLine={1}
        intro="Delivering infrastructure that supports Qatar’s growth — roads, earthworks, drainage and parking areas for Ashghal and other public-sector clients."
        image="ihe-project-aerial"
        imageAlt="Aerial view of an I.H.E. road and infrastructure corridor under construction"
      >
        <dl className="hero-meta">
          <div>
            <dt>Ongoing</dt>
            <dd>{countFor('Ongoing')} projects</dd>
          </div>
          <div>
            <dt>Completed</dt>
            <dd>{countFor('Completed')} projects</dd>
          </div>
        </dl>
      </PageHero>

      {/* Featured project */}
      {feature && (
        <section className="section section--white feature-project" aria-labelledby="feature-title">
          <div className="container feature-project__grid">
            <div className="feature-project__media">
              <MaskImage
                name={feature.image}
                alt={feature.imageAlt}
                className="feature-project__img"
                sizes="(max-width: 900px) 100vw, 60vw"
                from="left"
              />
              <span className="feature-project__tag mono">Featured · {feature.status}</span>
            </div>
            <div className="feature-project__body">
              <Reveal className="section-header__meta">
                <span className="section-header__index mono">01</span>
                <span className="eyebrow">Featured project</span>
              </Reveal>
              <MaskLines id="feature-title" lines={[feature.title]} className="h3 feature-project__title" />
              <Reveal delay={0.1}>
                <p className="lead muted">{feature.summary}</p>
              </Reveal>
              <RevealGroup as="dl" className="feature-project__facts" stagger={0.07} delay={0.15}>
                {[
                  ['Client', feature.client],
                  ['Scope', feature.scope],
                  ['Period', feature.period],
                  ['Location', feature.location],
                  ['Value', feature.value],
                ]
                  .filter(([, value]) => value && value !== '—')
                  .map(([label, value]) => (
                  <RevealItem key={label}>
                    <dt className="mono">{label}</dt>
                    <dd>{value}</dd>
                  </RevealItem>
                ))}
              </RevealGroup>
              <Reveal delay={0.3}>
                <Button variant="ghost-dark" onClick={() => setSelected(feature)}>
                  View project sheet
                </Button>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* Portfolio grid */}
      <section className="section section--light portfolio" aria-labelledby="portfolio-title">
        <div className="container">
          <SectionHeader
            id="portfolio-title"
            index="02"
            eyebrow="Portfolio"
            title={['Project', 'portfolio']}
            accentLine={1}
            aside={
              <FilterTabs id="project-filter" label="Filter projects by status" options={filters} value={filter} onChange={setFilter} count={countFor} />
            }
          />

          <motion.ul layout className="portfolio__grid" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((project) => (
                <motion.li
                  key={project.id}
                  id={project.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.7, ease: EASE_OUT }}
                >
                  <ProjectCard project={project} index={projects.indexOf(project)} onOpen={setSelected} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>
      </section>

      {/* Register */}
      <section className="section section--white register" aria-labelledby="register-title">
        <div className="container">
          <SectionHeader
            id="register-title"
            index="03"
            eyebrow="List of key projects"
            title={['Clients, values', '& status']}
            accentLine={1}
            intro="A consolidated record of our key projects, their clients and contract values."
          />
          <Reveal>
            <div className="register__table" role="table" aria-label="Project register">
              <div className="register__row register__row--head mono" role="row">
                <span role="columnheader">Project</span>
                <span role="columnheader">Client entity</span>
                <span role="columnheader">Value (QAR)</span>
                <span role="columnheader">Status</span>
                <span role="columnheader">Year</span>
              </div>
              {projects.map((p) => (
                <div className="register__row" role="row" key={p.id}>
                  <span role="cell" className="register__project">
                    {p.title}
                  </span>
                  <span role="cell" data-label="Client">
                    {p.client}
                  </span>
                  <span role="cell" data-label="Value" className="mono">
                    {p.value && p.value !== '—' ? p.value.replace(/^QAR /, '') : '—'}
                  </span>
                  <span role="cell" data-label="Status">
                    <span className={`status status--${p.status.toLowerCase()} register__status`}>{p.status}</span>
                  </span>
                  <span role="cell" data-label="Year" className="mono">
                    {p.period || '—'}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
          <p className="register__note mono">
            Deliver projects on time, with quality and safely.
          </p>
        </div>
      </section>

      <CtaBand />
      <ProjectDialog project={selected} onClose={closeDialog} />
    </div>
  )
}
