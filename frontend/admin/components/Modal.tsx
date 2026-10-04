import { X } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

interface DialogShellProps {
  title: string
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  variant?: 'modal' | 'drawer'
  size?: 'sm' | 'md' | 'lg'
  /** When set, the dialog body becomes a <form> and the footer's submit button submits it. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void
}

/**
 * Accessible dialog: focus moves inside on open and returns on close,
 * Tab is trapped, Escape and backdrop click close it, page scroll is locked.
 */
export function Dialog({ title, subtitle, onClose, children, footer, variant = 'modal', size = 'lg', onSubmit }: DialogShellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  useLayoutEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    document.body.classList.add('is-locked')
    const panel = ref.current
    const first = panel?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea, button:not(.modal__close)')
    ;(first ?? panel)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
      if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select, textarea, [tabindex="0"]')]
        if (!items.length) return
        const [a, b] = [items[0], items[items.length - 1]]
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          b.focus()
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault()
          a.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('is-locked')
      previous?.focus()
    }
  }, [])

  const content = (
    <>
      <div className="modal__head">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button type="button" className="icon-btn modal__close" onClick={onClose} aria-label="Close">
          <X />
        </button>
      </div>
      <div className="modal__body">{children}</div>
      {footer && <div className="modal__foot">{footer}</div>}
    </>
  )

  return (
    <div
      className={`overlay ${variant === 'drawer' ? 'overlay--drawer' : ''}`}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={variant === 'drawer' ? 'drawer' : `modal ${size === 'sm' ? 'modal--sm' : size === 'md' ? 'modal--md' : ''}`}
      >
        {onSubmit ? (
          <form style={{ display: 'contents' }} onSubmit={onSubmit} noValidate>
            {content}
          </form>
        ) : (
          content
        )}
      </div>
    </div>
  )
}

interface ConfirmProps {
  title: string
  message: ReactNode
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => Promise<void> | void
  onClose: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', danger = true, onConfirm, onClose }: ConfirmProps) {
  const [busy, setBusy] = useState(false)
  return (
    <Dialog
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onConfirm()
                onClose()
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy && <span className="spinner" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="muted" style={{ fontSize: 14 }}>
        {message}
      </p>
    </Dialog>
  )
}
