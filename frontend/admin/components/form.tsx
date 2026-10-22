import { ImagePlus, Images, Trash2, Upload } from 'lucide-react'
import { useId, useRef, useState, type ReactNode } from 'react'
import { api, ApiError } from '../../shared/api'
import { libraryImages, previewUrl } from '../../shared/images'
import { useToast } from './Toast'

/* ─── Field ───────────────────────────────────────────────── */

interface A11y {
  id: string
  'aria-invalid': boolean
  'aria-describedby'?: string
}

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: ReactNode
  className?: string
  children: (a11y: A11y) => ReactNode
}

export function Field({ label, required, error, hint, className = '', children }: FieldProps) {
  const id = useId()
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required && (
          <span className="field__req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
      {hint && !error && (
        <span id={`${id}-hint`} className="field__hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="field__error">
          {error}
        </span>
      )}
    </div>
  )
}

/* ─── Toggle ──────────────────────────────────────────────── */

export function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <div className="toggle-row">
      <div>
        <p className="toggle-row__title" id={id}>
          {label}
        </p>
        {description && <p className="toggle-row__desc">{description}</p>}
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-labelledby={id} className="switch" onClick={() => onChange(!checked)} />
    </div>
  )
}

/* ─── Image input ─────────────────────────────────────────── */

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

interface ImageInputProps {
  value: string | null
  onChange: (value: string | null) => void
  label: string
  hint?: string
  /** Cloudinary sub-folder; also decides which admins may upload (see the backend's upload route). */
  /** "certificates" also accepts PDF files. */
  folder: 'blogs' | 'hero' | 'projects' | 'services' | 'certificates' | 'branding' | 'avatars'
  /** Offer the website's bundled photography as quick choices. */
  library?: boolean
  error?: string
}

/** Drag & drop / click-to-browse image upload with preview, plus an optional photo library. */
export function ImageInput({ value, onChange, label, hint = 'Recommended size: 1200×800px', folder, library = true, error }: ImageInputProps) {
  const allowPdf = folder === 'certificates'
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const notify = useToast()
  const labelId = useId()

  const upload = async (file: File | undefined) => {
    if (!file) return
    const isPdf = file.type === 'application/pdf'
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) && !(allowPdf && isPdf))
      return notify(allowPdf ? 'Choose a PNG, JPG or WebP image, or a PDF.' : 'Choose a PNG, JPG or WebP image.', 'error')
    if (file.size > (isPdf ? 8 : 4) * 1024 * 1024) return notify(isPdf ? 'PDFs must be 8 MB or smaller.' : 'Images must be 4 MB or smaller.', 'error')
    setUploading(true)
    try {
      const { url } = await api<{ url: string }>('/admin/uploads', { method: 'POST', body: { dataUrl: await readAsDataUrl(file), folder } })
      onChange(url)
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Upload failed.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const preview = previewUrl(value)

  return (
    <div className="field">
      <span className="field__label" id={labelId}>
        {label}
      </span>
      {preview ? (
        <div className="dropzone__preview">
          <img src={preview} alt="" />
          <div className="dropzone__preview-actions">
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => inputRef.current?.click()}>
              <Upload /> Replace
            </button>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => onChange(null)} aria-label="Remove image">
              <Trash2 />
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-labelledby={labelId}
          className={`dropzone ${over ? 'is-over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), inputRef.current?.click())}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            upload(e.dataTransfer.files[0])
          }}
        >
          <span className="dropzone__icon">{uploading ? <span className="spinner" /> : <ImagePlus size={18} />}</span>
          <span className="dropzone__text">
            {uploading ? 'Uploading…' : (
              <>
                Drag &amp; drop a file, or <span>click to browse</span>
              </>
            )}
          </span>
          <span className="field__hint">{hint}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={allowPdf ? 'image/png,image/jpeg,image/webp,application/pdf' : 'image/png,image/jpeg,image/webp'}
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {library && (
        <>
          <button type="button" className="link-btn" style={{ justifySelf: 'start', fontSize: 13, display: 'inline-flex', gap: 6, alignItems: 'center' }} onClick={() => setShowLibrary((s) => !s)} aria-expanded={showLibrary}>
            <Images size={15} /> {showLibrary ? 'Hide photo library' : 'Choose from website photo library'}
          </button>
          {showLibrary && (
            <div className="library">
              {libraryImages.map((key) => (
                <button key={key} type="button" aria-pressed={value === key} aria-label={key.replace(/-/g, ' ')} onClick={() => onChange(key)}>
                  <img src={previewUrl(key)!} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {error && <span className="field__error">{error}</span>}
    </div>
  )
}
