import { Link } from 'react-router-dom'
import './logo.css'

interface LogoProps {
  tone?: 'light' | 'dark'
  onClick?: () => void
}

export function Logo({ tone = 'light', onClick }: LogoProps) {
  return (
    <Link to="/" className={`logo logo--${tone}`} onClick={onClick} aria-label="I.H.E. — International Heavy Equipment, home">
      <img className="logo__mark" src="/img/ihe-logo.png" alt="" width={184} height={136} />
      <span className="logo__text" aria-hidden="true">
        <span className="logo__name">International Heavy Equipment</span>
        <span className="logo__tag">Transport &amp; Contracting</span>
      </span>
    </Link>
  )
}
