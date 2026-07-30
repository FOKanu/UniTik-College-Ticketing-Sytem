import styles from './Avatar.module.css'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  src?: string
  color?: string
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ name, size = 'md', src, color }: AvatarProps) {
  if (src) {
    return (
      <img
        className={`${styles.avatar} ${styles[size]}`}
        src={src}
        alt=""
        aria-hidden
      />
    )
  }

  return (
    <span
      className={`${styles.avatar} ${styles[size]} ${styles.fallback}`}
      style={color ? { background: color } : undefined}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
