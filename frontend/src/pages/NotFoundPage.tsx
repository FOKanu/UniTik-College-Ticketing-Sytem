import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { ButtonLink } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  usePageTitle('Page not found')

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.code}>404</p>
        <h1>Page not found</h1>
        <p className={styles.copy}>
          The page you requested does not exist.
        </p>
        <ButtonLink to={ROUTES.dashboard}>Go to dashboard</ButtonLink>
        <p className={styles.alt}>
          Or <Link to={ROUTES.login}>sign in</Link> to continue.
        </p>
      </div>
    </main>
  )
}
