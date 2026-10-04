import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * A piece of UI state stored in the URL, e.g. `?edit=12` or `?view=3`.
 * Dialogs opened this way can be linked to from the dashboard, notifications
 * and global search, and the browser's Back button closes them.
 */
export function useQueryParam(name: string): [string | null, (value: string | null) => void] {
  const [params, setParams] = useSearchParams()
  const value = params.get(name)
  const setValue = useCallback(
    (next: string | null) => {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev)
          if (next === null) updated.delete(name)
          else updated.set(name, next)
          return updated
        },
        { replace: next === null },
      )
    },
    [name, setParams],
  )
  return [value, setValue]
}
