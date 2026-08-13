import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RouteTitle } from '@/app/RouteTitle'
import { ROUTES } from '@/app/routes'
import { RouteErrorBoundary } from '@/components/errors'
import { findInstitution } from '@/lib/institutions'
import { useInstitutionStore } from '@/stores'
import styles from './AuthLayout.module.css'

export function AuthLayout() {
  const { t } = useTranslation()
  const institutionId = useInstitutionStore((s) => s.institutionId)
  const institution = findInstitution(institutionId)

  return (
    <div className={styles.shell}>
      <RouteTitle />
      <a href="#auth-content" className={styles.skipLink}>
        {t('nav.skip')}
      </a>
      <div className={styles.panel}>
        <header className={styles.header}>
          <Link to={ROUTES.institution} className={styles.brand}>
            <span
              className={styles.logo}
              style={{ background: institution.color }}
            >
              {institution.short}
            </span>
            <span>
              <strong>{institution.name}</strong>
              <small>{t('authLayout.changeInstitution')}</small>
            </span>
          </Link>
        </header>
        <div id="auth-content">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </div>
      </div>
    </div>
  )
}
