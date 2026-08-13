import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES, agentTicketDetailPath } from '@/app/routes'
import { PriorityBadge, SlaBadge, StatusBadge } from '@/components/ui'
import { useAuthStore, useTicketStore } from '@/stores'
import styles from './AgentDashboardPage.module.css'

export function AgentDashboardPage() {
  const { t } = useTranslation()
  const hour = new Date().getHours()
  const greeting = t(hour < 12 ? 'agentDashboard.morning' : hour < 18 ? 'agentDashboard.afternoon' : 'agentDashboard.evening')
  const user = useAuthStore((s) => s.user)
  const items = useTicketStore((s) => s.items)
  const loading = useTicketStore((s) => s.loading)
  const setScope = useTicketStore((s) => s.setScope)
  const setFilters = useTicketStore((s) => s.setFilters)
  const fetchList = useTicketStore((s) => s.fetchList)

  useEffect(() => {
    setScope('queue')
    setFilters({
      query: '',
      status: 'all',
      department: 'all',
      priority: 'all',
      assignee: 'all',
    })
    void fetchList({ page: 1, pageSize: 50 })
  }, [setScope, setFilters, fetchList])

  const firstName = user?.displayName?.split(' ')[0] ?? t('agentDashboard.agent')
  const assigned = items.filter((t) => t.assignedTo === user?.id).length
  const unassigned = items.filter((t) => !t.assignedTo).length
  const resolvedToday = items.filter((t) => t.status === 'resolved').length
  const queue = items.slice(0, 6)
  const slaBreached = items.filter((t) => t.slaBreached).length
  const slaAtRisk = items.filter(
    (t) =>
      !t.slaBreached &&
      t.slaHoursRemaining != null &&
      t.slaHoursRemaining <= 8,
  ).length

  const byDept = ['Academics', 'IT', 'Finance', 'Maintenance'].map((dept) => ({
    dept,
    count: items.filter((t) => t.category === dept).length,
  }))
  const max = Math.max(...byDept.map((d) => d.count), 1)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          {greeting}, {firstName}
        </h1>
        <p>
          {t('agentDashboard.overview', { department: user?.department ?? 'IT' })}
        </p>
      </header>

      <section className={styles.stats} aria-label={t('agentDashboard.summary')}>
        <article>
          <span>{t('agentDashboard.assigned')}</span>
          <strong>{loading ? '…' : assigned}</strong>
        </article>
        <article>
          <span>{t('common.unassigned')}</span>
          <strong>{loading ? '…' : unassigned}</strong>
        </article>
        <article>
          <span>{t('agentDashboard.resolvedToday')}</span>
          <strong>{loading ? '…' : resolvedToday}</strong>
        </article>
        <article>
          <span>{t('agentDashboard.avgResponse')}</span>
          <strong>1.8h</strong>
        </article>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>{t('agentDashboard.myQueue')}</h2>
            <Link to={ROUTES.queue}>{t('agentDashboard.fullQueue')}</Link>
          </div>
          <table className={styles.table}>
            <caption className="sr-only">{t('agentDashboard.queueCaption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('tickets.titleLabel')}</th>
                <th scope="col">{t('tickets.priority')}</th>
                <th scope="col">{t('agentDashboard.sla')}</th>
                <th scope="col">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <Link to={agentTicketDetailPath(ticket.id)}>
                      {ticket.subject}
                    </Link>
                  </td>
                  <td>
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td>
                    <SlaBadge
                      hoursRemaining={ticket.slaHoursRemaining}
                      breached={ticket.slaBreached}
                    />
                  </td>
                  <td>
                    <StatusBadge status={ticket.status} />
                  </td>
                </tr>
              ))}
              {!loading && queue.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>
                    {t('agentDashboard.empty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <aside className={styles.aside}>
          <section className={styles.panel}>
            <h2>{t('agentDashboard.byDepartment')}</h2>
            <ul className={styles.bars}>
              {byDept.map((item) => (
                <li key={item.dept}>
                  <div className={styles.barMeta}>
                    <span>{t(`departments.${item.dept === 'IT' ? 'it' : item.dept.toLowerCase()}`)}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      style={{ width: `${(item.count / max) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.slaBox} role="status">
            <h2>{t('agentDashboard.warning')}</h2>
            <p>
              {slaBreached > 0
                ? t('agentDashboard.breached', { breached: slaBreached, risk: slaAtRisk })
                : slaAtRisk > 0
                  ? t('agentDashboard.atRisk', { count: slaAtRisk })
                  : t('agentDashboard.noRisk')}
            </p>
            <Link to={ROUTES.queue}>{t('agentDashboard.review')}</Link>
          </section>
        </aside>
      </div>
    </div>
  )
}
