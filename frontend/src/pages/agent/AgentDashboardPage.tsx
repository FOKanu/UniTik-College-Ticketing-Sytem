import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, agentTicketDetailPath } from '@/app/routes'
import { PriorityBadge, SlaBadge, StatusBadge } from '@/components/ui'
import { useAuthStore, useTicketStore } from '@/stores'
import styles from './AgentDashboardPage.module.css'

function greetingPrefix(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function AgentDashboardPage() {
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

  const firstName = user?.displayName?.split(' ')[0] ?? 'Agent'
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
          {greetingPrefix()}, {firstName}
        </h1>
        <p>
          {user?.department ?? 'IT'} Department · here is your queue overview.
        </p>
      </header>

      <section className={styles.stats} aria-label="Queue summary">
        <article>
          <span>Assigned to me</span>
          <strong>{loading ? '…' : assigned}</strong>
        </article>
        <article>
          <span>Unassigned</span>
          <strong>{loading ? '…' : unassigned}</strong>
        </article>
        <article>
          <span>Resolved today</span>
          <strong>{loading ? '…' : resolvedToday}</strong>
        </article>
        <article>
          <span>Avg first response</span>
          <strong>1.8h</strong>
        </article>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>My queue</h2>
            <Link to={ROUTES.queue}>Open full queue</Link>
          </div>
          <table className={styles.table}>
            <caption className="sr-only">Tickets assigned in your queue</caption>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Priority</th>
                <th scope="col">SLA</th>
                <th scope="col">Status</th>
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
                    No tickets in your queue.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <aside className={styles.aside}>
          <section className={styles.panel}>
            <h2>Tickets by department</h2>
            <ul className={styles.bars}>
              {byDept.map((item) => (
                <li key={item.dept}>
                  <div className={styles.barMeta}>
                    <span>{item.dept}</span>
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
            <h2>SLA warning</h2>
            <p>
              {slaBreached > 0
                ? `${slaBreached} breached · ${slaAtRisk} within 8 hours.`
                : slaAtRisk > 0
                  ? `${slaAtRisk} ticket${slaAtRisk === 1 ? '' : 's'} within 8 hours of SLA.`
                  : 'No tickets currently at SLA risk.'}
            </p>
            <Link to={ROUTES.queue}>Review at-risk tickets</Link>
          </section>
        </aside>
      </div>
    </div>
  )
}
