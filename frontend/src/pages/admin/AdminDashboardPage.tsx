import { ROUTES } from '@/app/routes'
import { useTranslation } from 'react-i18next'
import { ButtonLink } from '@/components/ui'
import { findInstitution } from '@/lib/institutions'
import { useAuthStore, useInstitutionStore } from '@/stores'
import styles from './AdminDashboardPage.module.css'

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const institutionId = useInstitutionStore((s) => s.institutionId)
  const institution = findInstitution(institutionId)
  const firstName = user?.displayName?.split(' ')[0] ?? 'Admin'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{t('titles.adminDashboard')}</h1>
        <p>{t('adminDashboard.welcome', { name: firstName, institution: institution.name })}</p>
      </header>

      <section className={styles.stats} aria-label={t('adminDashboard.overview')}>
        <article>
          <span>{t('adminDashboard.openTickets')}</span>
          <strong>34</strong>
        </article>
        <article>
          <span>{t('adminDashboard.breaches')}</span>
          <strong>2</strong>
        </article>
        <article>
          <span>{t('nav.departments')}</span>
          <strong>4</strong>
        </article>
        <article>
          <span>CSAT</span>
          <strong>4.6</strong>
        </article>
      </section>

      <section className={styles.cards} aria-label={t('adminDashboard.shortcuts')}>
        <article className={styles.card}>
          <h2>{t('adminDashboard.reports')}</h2><p>{t('adminDashboard.reportsBody')}</p>
          <ButtonLink to={ROUTES.analytics}>{t('adminDashboard.openAnalytics')}</ButtonLink>
        </article>
        <article className={styles.card}>
          <h2>{t('adminDashboard.people')}</h2><p>{t('adminDashboard.peopleBody')}</p>
          <ButtonLink to={ROUTES.settingsPeople}>{t('adminDashboard.managePeople')}</ButtonLink>
        </article>
        <article className={styles.card}>
          <h2>{t('admin.settings')}</h2><p>{t('adminDashboard.settingsBody')}</p>
          <ButtonLink to={ROUTES.settings}>{t('adminDashboard.openSettings')}</ButtonLink>
        </article>
        <article className={styles.card}>
          <h2>{t('adminDashboard.staffQueue')}</h2><p>{t('adminDashboard.queueBody')}</p>
          <ButtonLink to={ROUTES.queue} variant="secondary">
            {t('adminDashboard.openQueue')}
          </ButtonLink>
        </article>
      </section>
    </div>
  )
}
