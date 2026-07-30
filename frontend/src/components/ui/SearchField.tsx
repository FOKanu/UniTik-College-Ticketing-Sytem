import type { InputHTMLAttributes } from 'react'
import styles from './SearchField.module.css'

interface SearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label?: string
}

export function SearchField({
  label = 'Search',
  id = 'search',
  className,
  ...rest
}: SearchFieldProps) {
  return (
    <label className={`${styles.wrap} ${className ?? ''}`} htmlFor={id}>
      <span className={styles.srOnly}>{label}</span>
      <span className={styles.icon} aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="M20 20l-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <input id={id} type="search" className={styles.input} {...rest} />
    </label>
  )
}
