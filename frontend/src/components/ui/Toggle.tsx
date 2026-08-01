import styles from './Toggle.module.css'

interface ToggleProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({ id, label, checked, onChange }: ToggleProps) {
  return (
    <label className={styles.row} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      <span className={styles.control}>
        <input
          id={id}
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.track} aria-hidden>
          <span className={styles.thumb} />
        </span>
      </span>
    </label>
  )
}
