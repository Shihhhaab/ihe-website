import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { canAccess, type Area } from '../../../shared/constants'
import type { AdminUser } from '../../../shared/types'
import { api, UNAUTHORIZED_EVENT } from '../../shared/api'

interface AuthState {
  /** `undefined` while the session is being checked, `null` when signed out. */
  user: AdminUser | null | undefined
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setUser: (user: AdminUser) => void
  can: (area: Area) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined)

  useEffect(() => {
    api<{ user: AdminUser }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
    // Any 401 (expired session, account deactivated) returns to the sign-in screen.
    const onUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { user } = await api<{ user: AdminUser }>('/auth/login', { method: 'POST', body: { email, password } })
    setUser(user)
  }, [])

  const signOut = useCallback(async () => {
    await api('/auth/logout', { method: 'POST', body: {} }).catch(() => {})
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      signIn,
      signOut,
      setUser: (u) => setUser(u),
      can: (area) => !!user && canAccess(user.role, area),
    }),
    [user, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** The signed-in user; only call inside routes guarded by <RequireAuth>. */
// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser(): AdminUser {
  const { user } = useAuth()
  if (!user) throw new Error('No signed-in user')
  return user
}
