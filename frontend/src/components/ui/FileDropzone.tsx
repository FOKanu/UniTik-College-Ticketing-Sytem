import type { ChangeEvent } from 'react'
import styles from './FileDropzone.module.css'

interface FileDropzoneProps {
  id?: string
  fileName?: string | null
  onChange: (file: File | null) => void
  disabled?: boolean
  busy?: boolean
  busyLabel?: string
}

export function FileDropzone({
  id = 'file-upload',
  fileName,
  onChange,
  disabled = false,
  busy = false,
  busyLabel = 'Uploading…',
}: FileDropzoneProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0] ?? null)
    // Allow selecting the same file again after a failed upload.
    event.target.value = ''
  }

  const locked = disabled || busy

  return (
    <label
      className={`${styles.dropzone} ${locked ? styles.disabled : ''}`}
      htmlFor={id}
      aria-busy={busy || undefined}
    >
      <input
        id={id}
        type="file"
        className={styles.input}
        onChange={handleChange}
        disabled={locked}
        aria-describedby={`${id}-hint`}
      />
      <span className={styles.plus} aria-hidden>
        {busy ? '…' : '+'}
      </span>
      <span className={styles.title}>
        {busy ? busyLabel : fileName ? fileName : 'Add screenshot or file'}
      </span>
      <span id={`${id}-hint`} className={styles.hint}>
        Max 10 MB. Accepted formats: images and documents.
      </span>
    </label>
  )
}
