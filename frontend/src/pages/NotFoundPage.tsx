import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/routes'
import { ButtonLink } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  const { t } = useTranslation()
  usePageTitle(t('errors.notFound'))

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.code}>404</p>
        <h1>{t('errors.notFound')}</h1>
        <p className={styles.copy}>{t('errors.notFoundBody')}</p>
        <ButtonLink to={ROUTES.dashboard}>{t('errors.dashboard')}</ButtonLink>
        <p className={styles.alt}>
          <Trans i18nKey="errors.orSignIn" components={{ signIn: <Link to={ROUTES.login} /> }} />
        </p>
      </div>
    </main>
  )
}
