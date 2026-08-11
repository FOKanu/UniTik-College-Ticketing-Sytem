import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, agentTicketDetailPath } from '@/app/routes'
import { PriorityBadge, SlaBadge, StatusBadge } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { useAuthStore, useTicketStore } from '@/stores'
import styles from './AgentDashboardPage.module.css'

export function AgentDashboardPage() {
  const t = useT()
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

  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? t('agent.greeting.morning')
      : hour < 18
        ? t('agent.greeting.afternoon')
        : t('agent.greeting.evening')
  const firstName = user?.displayName?.split(' ')[0] ?? 'Agent'
  const assigned = items.filter((ticket) => ticket.assignedTo === user?.id)
    .length
  const unassigned = items.filter((ticket) => !ticket.assignedTo).length
  const resolvedToday = items.filter((ticket) => ticket.status === 'resolved')
    .length
  const queue = items.slice(0, 6)
  const slaBreached = items.filter((ticket) => ticket.slaBreached).length
  const slaAtRisk = items.filter(
    (ticket) =>
      !ticket.slaBreached &&
      ticket.slaHoursRemaining != null &&
      ticket.slaHoursRemaining <= 8,
  ).length

  const byDept = ['Academics', 'IT', 'Finance', 'Maintenance'].map((dept) => ({
    dept,
    label:
      dept === 'Academics'
        ? t('dept.Academics')
        : dept === 'IT'
          ? t('dept.IT')
          : dept === 'Finance'
            ? t('dept.Finance')
            : t('dept.Maintenance'),
    count: items.filter((ticket) => ticket.category === dept).length,
  }))
  const max = Math.max(...byDept.map((d) => d.count), 1)

  const slaMessage =
    slaBreached > 0
      ? t('agent.sla.breached', { breached: slaBreached, atRisk: slaAtRisk })
      : slaAtRisk > 0
        ? slaAtRisk === 1
          ? t('agent.sla.atRiskOne')
          : t('agent.sla.atRisk', { count: slaAtRisk })
        : t('agent.sla.ok')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          {greeting}, {firstName}
        </h1>
        <p>
          {t('agent.subtitle', { dept: user?.department ?? t('dept.IT') })}
        </p>
      </header>

      <section
        className={styles.stats}
        aria-label={t('agent.queueSummaryAria')}
      >
        <article>
          <span>{t('agent.assignedToMe')}</span>
          <strong>{loading ? '…' : assigned}</strong>
        </article>
        <article>
          <span>{t('agent.unassigned')}</span>
          <strong>{loading ? '…' : unassigned}</strong>
        </article>
        <article>
          <span>{t('agent.resolvedToday')}</span>
          <strong>{loading ? '…' : resolvedToday}</strong>
        </article>
        <article>
          <span>{t('agent.avgFirstResponse')}</span>
          <strong>1.8h</strong>
        </article>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>{t('agent.myQueue')}</h2>
            <Link to={ROUTES.queue}>{t('agent.openFullQueue')}</Link>
          </div>
          <table className={styles.table}>
            <caption className="sr-only">{t('agent.queueCaption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('table.title')}</th>
                <th scope="col">{t('table.priority')}</th>
                <th scope="col">{t('table.sla')}</th>
                <th scope="col">{t('table.status')}</th>
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
                    {t('agent.noTickets')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <aside className={styles.aside}>
          <section className={styles.panel}>
            <h2>{t('agent.byDept')}</h2>
            <ul className={styles.bars}>
              {byDept.map((item) => (
                <li key={item.dept}>
                  <div className={styles.barMeta}>
                    <span>{item.label}</span>
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
            <h2>{t('agent.slaWarning')}</h2>
            <p>{slaMessage}</p>
            <Link to={ROUTES.queue}>{t('agent.reviewAtRisk')}</Link>
          </section>
        </aside>
      </div>
    </div>
  )
}
