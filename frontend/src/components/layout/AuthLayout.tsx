import { Link, Outlet } from 'react-router-dom'
import { RouteTitle } from '@/app/RouteTitle'
import { ROUTES } from '@/app/routes'
import { RouteErrorBoundary } from '@/components/errors'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import { ThemeSelector } from '@/components/layout/ThemeSelector'
import { useT } from '@/lib/i18n'
import { findInstitution } from '@/lib/institutions'
import { useInstitutionStore } from '@/stores'
import styles from './AuthLayout.module.css'

export function AuthLayout() {
  const t = useT()
  const institutionId = useInstitutionStore((s) => s.institutionId)
  const institution = findInstitution(institutionId)

  return (
    <div className={styles.shell}>
      <RouteTitle />
      <a href="#auth-content" className={styles.skipLink}>
        {t('auth.signIn')}
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
              <small>{t('auth.changeInstitution')}</small>
            </span>
          </Link>
          <div className={styles.headerTools}>
            <ThemeSelector compact />
            <LanguageSelector compact />
          </div>
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
