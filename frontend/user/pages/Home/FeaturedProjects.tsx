import { RevealGroup, RevealItem } from '../../components/animations/Reveal'
import { TextLink } from '../../components/buttons/Button'
import { ProjectCard } from '../../components/cards/ProjectCard'
import { SectionHeader } from '../../components/sections/SectionHeader'
import { useProjects } from '../../hooks/usePublicContent'

/** Asymmetric showcase: one large feature project beside two stacked projects. */
export function FeaturedProjects() {
  const { data: projects } = useProjects()
  const feature = projects.find((p) => p.featured) ?? projects[0]
  const rest = projects.filter((p) => p !== feature)
  if (!feature) return null
  return (
    <section className="section section--white featured" aria-labelledby="featured-title">
      <div className="container">
        <SectionHeader
          id="featured-title"
          index="03"
          eyebrow="Selected projects"
          title={['Infrastructure for', 'Qatar’s growth']}
          accentLine={1}
          intro="Roads, drainage, parking and infrastructure works for Ashghal, the Supreme Committee, the Qatar Armed Forces and major contractors."
          aside={<TextLink to="/projects">All projects</TextLink>}
        />

        <RevealGroup className="featured__grid" stagger={0.12}>
          <RevealItem className="featured__main">
            <ProjectCard project={feature} index={0} variant="feature" sizes="(max-width: 900px) 100vw, 60vw" />
          </RevealItem>
          {rest.slice(0, 2).map((project, i) => (
            <RevealItem key={project.id} className="featured__side">
              <ProjectCard project={project} index={i + 1} sizes="(max-width: 900px) 100vw, 35vw" />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
