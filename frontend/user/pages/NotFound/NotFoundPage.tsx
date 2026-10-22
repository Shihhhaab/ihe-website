import { MaskLines } from '../../components/animations/MaskLines'
import { Reveal } from '../../components/animations/Reveal'
import { Button } from '../../components/buttons/Button'
import { usePageMeta } from '../../hooks/usePageMeta'
import './not-found.css'

export default function NotFoundPage() {
  usePageMeta('Page not found')
  return (
    <div className="page">
      <section className="not-found">
        <div className="container not-found__inner">
          <span className="not-found__code mono" aria-hidden="true">
            Error 404
          </span>
          <MaskLines as="h1" lines={['Off the', 'mapped route']} accentLine={1} className="not-found__title" immediate delay={0.5} />
          <Reveal delay={0.8}>
            <p className="lead muted">The page you’re looking for has moved or doesn’t exist.</p>
          </Reveal>
          <Reveal delay={0.95} className="not-found__actions">
            <Button to="/">Back to home</Button>
            <Button to="/contact" variant="ghost-dark">
              Contact us
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
