import { LayoutGroup, motion } from 'motion/react'
import { EASE_OUT } from '../../lib/motion'
import './filter-tabs.css'

interface FilterTabsProps<T extends string> {
  id: string
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  count?: (option: T) => number
}

/** Segmented filter with a sliding active pill. */
export function FilterTabs<T extends string>({ id, label, options, value, onChange, count }: FilterTabsProps<T>) {
  return (
    <LayoutGroup id={id}>
      <div className="filter" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`filter__btn ${value === option ? 'is-active' : ''}`}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {value === option && (
              <motion.span layoutId={`${id}-pill`} className="filter__pill" transition={{ duration: 0.5, ease: EASE_OUT }} />
            )}
            <span className="filter__label">
              {option}
              {count && <span className="mono">{String(count(option)).padStart(2, '0')}</span>}
            </span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  )
}
