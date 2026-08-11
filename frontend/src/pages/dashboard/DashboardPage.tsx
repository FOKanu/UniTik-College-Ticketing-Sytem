import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, ticketDetailPath } from '@/app/routes'
import { ButtonLink, DepartmentBadge, StatusBadge } from '@/components/ui'
import { IconPlus } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { useAuthStore, useTicketStore } from '@/stores'
import styles from './DashboardPage.module.css'

function relativeTime(
  iso: string,
  t: ReturnType<typeof useT>,
): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return t('time.minutesAgo', { n: Math.max(mins, 1) })
  const hours = Math.round(mins / 60)
  if (hours < 24) return t('time.hoursAgo', { n: hours })
  return t('time.daysAgo', { n: Math.round(hours / 24) })
}

export function DashboardPage() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const items = useTicketStore((s) => s.items)
  const setScope = useTicketStore((s) => s.setScope)
  const setFilters = useTicketStore((s) => s.setFilters)
  const fetchList = useTicketStore((s) => s.fetchList)
  const loading = useTicketStore((s) => s.loading)

  useEffect(() => {
    setScope('mine')
    setFilters({
      query: '',
      status: 'all',
      department: 'all',
      priority: 'all',
    })
    void fetchList({ page: 1, pageSize: 20 })
  }, [setScope, setFilters, fetchList])

  const open = items.filter((ticket) => ticket.status === 'open').length
  const inProgress = items.filter(
    (ticket) => ticket.status === 'in_progress',
  ).length
  const resolved = items.filter((ticket) => ticket.status === 'resolved').length
  const firstName = user?.displayName?.split(' ')[0] ?? 'Student'
  const active = items.filter(
    (ticket) =>
      ticket.status === 'open' || ticket.status === 'in_progress',
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t('dash.welcome', { name: firstName })}</h1>
          <p>{t('dash.subtitle')}</p>
        </div>
        <ButtonLink to={ROUTES.ticketNew}>
          <IconPlus width={18} height={18} />
          {t('dash.newTicket')}
        </ButtonLink>
      </header>

      <section className={styles.stats} aria-label={t('dash.summaryAria')}>
        <article className={styles.statOpen}>
          <span>{t('dash.open')}</span>
          <strong>{loading ? '…' : open}</strong>
        </article>
        <article className={styles.statProgress}>
          <span>{t('dash.inProgress')}</span>
          <strong>{loading ? '…' : inProgress}</strong>
        </article>
        <article className={styles.statResolved}>
          <span>{t('dash.resolved')}</span>
          <strong>{loading ? '…' : resolved}</strong>
        </article>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>{t('dash.activeTickets')}</h2>
            <Link to={ROUTES.tickets}>{t('dash.viewAll')}</Link>
          </div>
          {active.length === 0 && !loading ? (
            <p className={styles.empty}>{t('dash.noActive')}</p>
          ) : (
            <ul className={styles.list}>
              {(active.length ? active : items).slice(0, 5).map((ticket) => (
                <li key={ticket.id}>
                  <Link to={ticketDetailPath(ticket.id)} className={styles.item}>
                    <div className={styles.itemTop}>
                      <strong>{ticket.subject}</strong>
                      <time dateTime={ticket.updatedAt}>
                        {relativeTime(ticket.updatedAt, t)}
                      </time>
                    </div>
                    <div className={styles.badges}>
                      <DepartmentBadge department={ticket.category} />
                      <StatusBadge status={ticket.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className={styles.aside}>
          <section className={styles.panel}>
            <h2>{t('dash.suggested')}</h2>
            <ul className={styles.articles}>
              <li>
                <Link to={ROUTES.faq}>
                  {t('dash.article.password')}
                  <span aria-hidden="true">›</span>
                </Link>
              </li>
              <li>
                <Link to={ROUTES.faq}>
                  {t('dash.article.wifi')}
                  <span aria-hidden="true">›</span>
                </Link>
              </li>
              <li>
                <Link to={ROUTES.faq}>
                  {t('dash.article.tuition')}
                  <span aria-hidden="true">›</span>
                </Link>
              </li>
            </ul>
          </section>

          <section className={styles.aiCard}>
            <h2>{t('dash.needAnswer')}</h2>
            <p>{t('dash.aiHint')}</p>
            <ButtonLink to={ROUTES.assistant} variant="secondary">
              {t('dash.openChat')}
            </ButtonLink>
          </section>
        </aside>
      </div>
    </div>
  )
}
