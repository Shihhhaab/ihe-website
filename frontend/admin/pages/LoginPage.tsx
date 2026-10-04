import { AlertCircle, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../shared/api'
import { useAuth } from '../auth/AuthContext'
import { Splash } from '../layouts/AdminLayout'
import './login.css'

/** Only follow in-app redirect targets, never external URLs. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/')

export default function LoginPage() {
  const { user, signIn } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user === undefined) return <Splash />
  if (user) return <Navigate to={safeNext(params.get('next'))} replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setBusy(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <section className="login__brand" aria-hidden="true">
        <div className="login__brand-top">
          <img className="brand-tile" src="/img/ihe-logo.png" alt="" width={184} height={136} />
          <span className="brand-name">
            I.H.E. <span>ADMIN</span>
          </span>
        </div>
        <div>
          <p className="login__kicker">International Heavy Equipment</p>
          <p className="login__headline">Manage enquiries, projects, services, certificates and website content in one place.</p>
        </div>
        <p className="login__foot">Doha, State of Qatar</p>
      </section>

      <main className="login__panel">
        <form className="login__form" onSubmit={onSubmit} noValidate>
          <span className="login__lock" aria-hidden="true">
            <LockKeyhole size={20} />
          </span>
          <h1>Sign in</h1>
          <p className="muted">Use your I.H.E. admin account to continue.</p>

          {error && (
            <div className="alert alert--error" role="alert">
              <AlertCircle />
              {error}
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="email">
              Email
            </label>
            <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">
              Password
            </label>
            <div className="login__password">
              <input
                id="password"
                className="input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="login__reveal" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={busy} style={{ height: 42 }}>
            {busy && <span className="spinner" />}
            Sign in
          </button>

          <p className="login__note">
            Forgotten your password? Ask a super admin to reset it from <strong>Users</strong>.
          </p>
        </form>
        <a href="/" className="login__back">
          ← Back to website
        </a>
      </main>
    </div>
  )
}
