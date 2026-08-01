import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import styles from './Textarea.module.css'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, id, className, ...rest }, ref) {
    const inputId = id ?? rest.name
    const errorId = error && inputId ? `${inputId}-error` : undefined

    return (
      <label className={styles.field} htmlFor={inputId}>
        {label ? <span className={styles.label}>{label}</span> : null}
        <textarea
          ref={ref}
          id={inputId}
          className={`${styles.textarea} ${error ? styles.inputError : ''} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          {...rest}
        />
        {error ? (
          <span id={errorId} className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </label>
    )
  },
)
