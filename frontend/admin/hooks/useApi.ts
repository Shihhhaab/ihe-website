import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../../shared/api'

/** Loads a GET endpoint and exposes the data with a `reload` for after mutations. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(path !== null)
  const [version, setVersion] = useState(0)
  const first = useRef(true)

  useEffect(() => {
    if (path === null) return
    const controller = new AbortController()
    // Keep showing current data during background refreshes; only the first load shows skeletons.
    if (first.current) setLoading(true)
    api<T>(path, { signal: controller.signal })
      .then((result) => {
        setData(result)
        setError(null)
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setError(err instanceof ApiError ? err : new ApiError(0, String(err)))
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
          first.current = false
        }
      })
    return () => controller.abort()
  }, [path, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data, error, loading, reload, setData }
}
