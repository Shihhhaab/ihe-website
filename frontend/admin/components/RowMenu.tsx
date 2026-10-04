import { MoreHorizontal, MoreVertical, type LucideIcon } from 'lucide-react'
import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { useDismiss } from '../hooks/useDismiss'

export interface MenuAction {
  label: string
  icon?: LucideIcon
  onSelect: () => void
  danger?: boolean
  hidden?: boolean
}

interface RowMenuProps {
  label: string
  actions: MenuAction[]
  vertical?: boolean
  className?: string
}

/** "…" action menu used on table rows and cards. Arrow keys move between items. */
export function RowMenu({ label, actions, vertical = false, className = '' }: RowMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)
  const visible = actions.filter((a) => !a.hidden)

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(ref.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])]
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(index + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(index - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const Icon = vertical ? MoreVertical : MoreHorizontal

  return (
    <div className={`row-menu ${className}`} ref={ref}>
      <button
        type="button"
        className="row-menu__btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
          // Focus the first item after the menu renders.
          requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus())
        }}
      >
        <Icon />
      </button>
      {open && (
        <div className="popover" role="menu" aria-label={label} onKeyDown={onMenuKey}>
          {visible.map(({ label: itemLabel, icon: ItemIcon, onSelect, danger }, i) => (
            <div key={itemLabel}>
              {danger && i > 0 && <div className="menu-sep" />}
              <button
                type="button"
                role="menuitem"
                className={`menu-item ${danger ? 'menu-item--danger' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  onSelect()
                }}
              >
                {ItemIcon && <ItemIcon />}
                {itemLabel}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
