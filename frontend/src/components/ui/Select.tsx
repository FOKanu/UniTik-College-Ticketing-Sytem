import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import styles from './Select.module.css'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Array<{ value: string; label: string }>
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, error, id, className, ...rest },
  ref,
) {
  const inputId = id ?? rest.name
  const errorId = error && inputId ? `${inputId}-error` : undefined
  const Wrapper = label ? 'label' : 'div'

  return (
    <Wrapper className={styles.field} {...(label ? { htmlFor: inputId } : {})}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <div className={styles.wrap}>
        <select
          ref={ref}
          id={inputId}
          className={`${styles.select} ${error ? styles.inputError : ''} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </div>
      {error ? (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </Wrapper>
  )
})
