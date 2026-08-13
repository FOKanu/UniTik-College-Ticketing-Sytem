import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/routes'
import { ButtonLink } from '@/components/ui'
import { homePathForRole } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'

import type { UserRole } from '@/types'

import styles from './ForbiddenPage.module.css'



export function ForbiddenPage() {
  const { t } = useTranslation()

  const user = useAuthStore((s) => s.user)

  const location = useLocation()

  const requiredRoles = (

    location.state as { requiredRoles?: UserRole[] } | null

  )?.requiredRoles



  const home = user ? homePathForRole(user.role) : ROUTES.login



  return (

    <main className={styles.page}>

      <div className={styles.card}>

        <p className={styles.code}>403</p>

        <h1>{t('errors.denied')}</h1>

        <p className={styles.copy}>

          {t('errors.noPermission')}

          {user ? (

            <>

              {' '}

              (<strong>{user.role}</strong>)

            </>

          ) : null}{' '}


          {requiredRoles?.length ? (

            <>

              {' '}{t('common.role', { defaultValue: 'Role' })}:{' '}

              <strong>{requiredRoles.join(', ')}</strong>

            </>

          ) : (

            ''

          )}

        </p>

        <div className={styles.actions}>

          <ButtonLink to={home}>{t('errors.home')}</ButtonLink>

          <ButtonLink to={ROUTES.faq} variant="secondary">

            FAQ

          </ButtonLink>

        </div>

      </div>

    </main>

  )

}

