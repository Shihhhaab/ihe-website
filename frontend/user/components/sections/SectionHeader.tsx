import type { ReactNode } from 'react'
import { MaskLines } from '../animations/MaskLines'
import { Reveal } from '../animations/Reveal'
import './sections.css'

interface SectionHeaderProps {
  eyebrow: string
  index?: string
  title: string[]
  accentLine?: number
  intro?: ReactNode
  aside?: ReactNode
  className?: string
  id?: string
}

/** Numbered eyebrow, masked headline and optional intro/aside column. */
export function SectionHeader({ eyebrow, index, title, accentLine, intro, aside, className = '', id }: SectionHeaderProps) {
  return (
    <header className={`section-header ${className}`}>
      <div className="section-header__main">
        <Reveal className="section-header__meta">
          {index && <span className="section-header__index mono">{index}</span>}
          <span className="eyebrow">{eyebrow}</span>
        </Reveal>
        <MaskLines id={id} lines={title} className="h2 section-header__title" accentLine={accentLine} />
      </div>
      {(intro || aside) && (
        <Reveal className="section-header__aside" delay={0.15}>
          {intro && <p className="lead muted">{intro}</p>}
          {aside}
        </Reveal>
      )}
    </header>
  )
}
