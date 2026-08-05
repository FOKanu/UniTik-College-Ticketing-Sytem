import { Link, Outlet } from 'react-router-dom'
import { RouteTitle } from '@/app/RouteTitle'
import { ROUTES } from '@/app/routes'
import { RouteErrorBoundary } from '@/components/errors'
import { useInstitutionStore } from '@/stores/institutionStore'
import styles from './AuthLayout.module.css'

export function AuthLayout() {
  const institution = useInstitutionStore((s) => s.institution)

  return (
    <div className={styles.shell}>
      <RouteTitle />
      <a href="#auth-content" className={styles.skipLink}>
        Skip to sign in form
      </a>
      <div className={styles.panel}>
        <header className={styles.header}>
          <Link to={ROUTES.institution} className={styles.brand}>
            <span className={styles.logo}>{institution.short}</span>
            <span>
              <strong>{institution.name}</strong>
              <small>TicketHub</small>
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
