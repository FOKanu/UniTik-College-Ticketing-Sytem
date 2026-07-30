import { ROUTES } from '@/app/routes'
import { Button, ButtonLink } from '@/components/ui'
import { homePathForRole } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'
import styles from './ErrorFallback.module.css'

export interface ErrorFallbackProps {
  error?: Error
  title?: string
  description?: string
  compact?: boolean
  onRetry?: () => void
}

export function ErrorFallback({
  error,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. You can try again or return home.',
  compact = false,
  onRetry,
}: ErrorFallbackProps) {
  const user = useAuthStore((s) => s.user)
  const home = user ? homePathForRole(user.role) : ROUTES.login
  const showDetails = import.meta.env.DEV && error

  return (
    <div
      className={`${styles.page} ${compact ? styles.compact : ''}`}
      role="alert"
    >
      <div className={styles.card}>
        <p className={styles.code}>Error</p>
        <h1>{title}</h1>
        <p className={styles.copy}>{description}</p>
        {showDetails ? (
          <pre className={styles.details}>{error.message}</pre>
        ) : null}
        <div className={styles.actions}>
          {onRetry ? (
            <Button type="button" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
          <ButtonLink to={home} variant="secondary">
            Go home
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
