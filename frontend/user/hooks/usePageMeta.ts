import { useEffect } from 'react'

const SITE = 'International Heavy Equipment (I.H.E.)'

/** Sets the document title and meta description for the current page. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : `${SITE} | Roads, Infrastructure & General Contracting Qatar`
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    }
  }, [title, description])
}
