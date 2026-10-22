import { stats } from '../../data/company'
import { Counter } from '../animations/Counter'
import { RevealGroup, RevealItem } from '../animations/Reveal'
import './sections.css'

/** Four key company figures with count-up numbers, divided by hairlines. */
export function StatsBand({ tone = 'light' }: { tone?: 'light' }) {
  return (
    <RevealGroup as="ul" className={`stats-band stats-band--${tone}`} stagger={0.12}>
      {stats.map((stat, i) => (
        <RevealItem as="li" key={stat.label} className="stats-band__item">
          <span className="stats-band__index mono">{String(i + 1).padStart(2, '0')}</span>
          <p className="stats-band__value">
            <Counter value={stat.value} />
            {stat.suffix && <span className="stats-band__suffix">{stat.suffix}</span>}
          </p>
          <p className="stats-band__label">{stat.label}</p>
          {stat.note && <p className="stats-band__note mono">{stat.note}</p>}
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
