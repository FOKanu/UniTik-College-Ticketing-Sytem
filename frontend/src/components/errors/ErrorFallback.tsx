import { ROUTES } from '@/app/routes'
import { useTranslation } from 'react-i18next'
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
  title,
  description,
  compact = false,
  onRetry,
}: ErrorFallbackProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const home = user ? homePathForRole(user.role) : ROUTES.login
  const showDetails = import.meta.env.DEV && error

  return (
    <div
      className={`${styles.page} ${compact ? styles.compact : ''}`}
      role="alert"
    >
      <div className={styles.card}>
        <p className={styles.code}>{t('errors.label')}</p>
        <h1>{title ?? t('errors.generic')}</h1>
        <p className={styles.copy}>{description ?? t('errors.genericBody')}</p>
        {showDetails ? (
          <pre className={styles.details}>{error.message}</pre>
        ) : null}
        <div className={styles.actions}>
          {onRetry ? (
            <Button type="button" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          ) : null}
          <ButtonLink to={home} variant="secondary">
            {t('errors.goHome')}
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
