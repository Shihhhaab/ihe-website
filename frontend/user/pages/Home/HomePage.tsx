import { CtaBand } from '../../components/sections/CtaBand'
import { PartnersMarquee } from '../../components/sections/PartnersMarquee'
import { SafetySection } from '../../components/sections/SafetySection'
import { usePageMeta } from '../../hooks/usePageMeta'
import { FeaturedProjects } from './FeaturedProjects'
import { HomeHero } from './HomeHero'
import { IntroSection } from './IntroSection'
import { ServicesShowcase } from './ServicesShowcase'
import { WhySection } from './WhySection'
import './home.css'

export default function HomePage() {
  usePageMeta('')
  return (
    <div className="page">
      <HomeHero />
      <IntroSection />
      <ServicesShowcase />
      <FeaturedProjects />
      <PartnersMarquee />
      <WhySection />
      <SafetySection index="05" />
      <CtaBand />
    </div>
  )
}
