import { ArrowUpRight } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './button.css'

type Variant = 'primary' | 'outline' | 'dark' | 'ghost-dark'

interface BaseProps {
  children: ReactNode
  variant?: Variant
  icon?: ReactNode | false
  className?: string
}

type ButtonProps = BaseProps &
  (
    | { to: string; href?: never }
    | { href: string; to?: never }
    | ({ to?: never; href?: never } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>)
  )

/** Primary call-to-action. Renders a router link, an external anchor, or a button. */
export function Button({ children, variant = 'primary', icon, className = '', ...rest }: ButtonProps) {
  const classes = `btn btn--${variant} ${className}`
  const content = (
    <>
      <span className="btn__label">{children}</span>
      {icon !== false && (
        <span className="btn__icon" aria-hidden="true">
          {icon ?? <ArrowUpRight size={18} strokeWidth={1.75} />}
        </span>
      )}
    </>
  )

  if ('to' in rest && rest.to) {
    return (
      <Link to={rest.to} className={classes}>
        {content}
      </Link>
    )
  }
  if ('href' in rest && rest.href) {
    const external = rest.href.startsWith('http')
    return (
      <a href={rest.href} className={classes} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {content}
      </a>
    )
  }
  const { type = 'button', ...buttonProps } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type={type} className={classes} {...buttonProps}>
      {content}
    </button>
  )
}

/** Understated inline link with an animated arrow and underline. */
export function TextLink({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`text-link ${className}`}>
      <span>{children}</span>
      <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  )
}
