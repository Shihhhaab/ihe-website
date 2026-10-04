import type { ErrorRequestHandler, RequestHandler } from 'express'
import type { FieldErrors, Result } from '../../../shared/validation.ts'

export class HttpError extends Error {
  status: number
  fields?: FieldErrors

  constructor(status: number, message: string, fields?: FieldErrors) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

export const badRequest = (message: string, fields?: FieldErrors) => new HttpError(400, message, fields)
export const notFound = (what = 'Resource') => new HttpError(404, `${what} not found.`)
export const forbidden = (message = 'You do not have permission to do that.') => new HttpError(403, message)

/** Unwraps a validation result or throws a 400 with the field errors. */
export function valid<T>(result: Result<T>): T {
  if (!result.ok) throw badRequest('Please correct the highlighted fields.', result.errors)
  return result.value
}

/** Parses a positive integer route id or throws 404. */
export function idParam(raw: string | string[] | undefined): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) throw notFound()
  return id
}

export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found.' })
}

export function errorHandler(log: (err: unknown) => void): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message, ...(err.fields ? { fields: err.fields } : {}) })
      return
    }
    // Malformed / oversized JSON bodies from express.json()
    const status = (err as { status?: number; type?: string }).status
    if (status === 400 || status === 413) {
      res.status(status).json({ error: status === 413 ? 'Request is too large.' : 'Malformed request body.' })
      return
    }
    log(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
