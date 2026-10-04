import { useCallback, useState } from 'react'
import { ApiError } from '../../shared/api'
import { useToast } from '../components/Toast'

/**
 * Holds form values plus server-side field errors. `submit` runs a save
 * function and maps API validation errors back onto the fields.
 */
export function useForm<T extends object>(initial: T) {
  const [values, setValues] = useState<T>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const notify = useToast()

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => {
      if (!e[key as string]) return e
      const next = { ...e }
      delete next[key as string]
      return next
    })
  }, [])

  const submit = useCallback(
    async (save: (values: T) => Promise<unknown>) => {
      setSubmitting(true)
      try {
        await save(values)
        setErrors({})
        return true
      } catch (err) {
        if (err instanceof ApiError && Object.keys(err.fields).length) {
          setErrors(err.fields)
          notify('Please correct the highlighted fields.', 'error')
        } else {
          notify(err instanceof ApiError ? err.message : 'Something went wrong.', 'error')
        }
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [values, notify],
  )

  return { values, set, setValues, errors, setErrors, submitting, submit }
}
