import type { ChangeEvent } from 'react'
import styles from './FileDropzone.module.css'

interface FileDropzoneProps {
  id?: string
  fileName?: string | null
  onChange: (file: File | null) => void
}

export function FileDropzone({
  id = 'file-upload',
  fileName,
  onChange,
}: FileDropzoneProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0] ?? null)
  }

  return (
    <label className={styles.dropzone} htmlFor={id}>
      <input
        id={id}
        type="file"
        className={styles.input}
        onChange={handleChange}
        aria-describedby={`${id}-hint`}
      />
      <span className={styles.plus} aria-hidden>
        +
      </span>
      <span className={styles.title}>
        {fileName ? fileName : 'Add screenshot or file'}
      </span>
      <span id={`${id}-hint`} className={styles.hint}>
        Max 10 MB. Accepted formats: images and documents.
      </span>
    </label>
  )
}
