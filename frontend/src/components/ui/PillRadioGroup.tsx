import { useId, type KeyboardEvent } from 'react'
import styles from './PillRadioGroup.module.css'

interface PillRadioGroupProps<T extends string> {
  name: string
  legend: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  error?: string
}

export function PillRadioGroup<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
  error,
}: PillRadioGroupProps<T>) {
  const legendId = useId()
  const errorId = error ? `${name}-error` : undefined

  function moveSelection(direction: 1 | -1) {
    const index = options.findIndex((option) => option.value === value)
    const next =
      (index + direction + options.length) % options.length
    onChange(options[next]!.value)
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, optionValue: T) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      onChange(optionValue)
      return
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      moveSelection(1)
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveSelection(-1)
    }
  }

  return (
    <fieldset className={styles.fieldset}>
      <legend id={legendId}>{legend}</legend>
      <div
        role="radiogroup"
        aria-labelledby={legendId}
        aria-describedby={errorId}
        className={styles.group}
      >
        {options.map((option) => {
          const checked = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              name={name}
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              className={checked ? styles.active : styles.option}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => onKeyDown(event, option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
