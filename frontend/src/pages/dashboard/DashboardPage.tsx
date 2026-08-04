import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, ticketDetailPath } from '@/app/routes'
import { ButtonLink, DepartmentBadge, StatusBadge } from '@/components/ui'
import { IconPlus } from '@/components/ui/icons'
import { useAuthStore, useTicketStore } from '@/stores'
import styles from './DashboardPage.module.css'

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function DashboardPage() {
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

  const open = items.filter((t) => t.status === 'open').length
  const inProgress = items.filter((t) => t.status === 'in_progress').length
  const resolved = items.filter((t) => t.status === 'resolved').length
  const firstName = user?.displayName?.split(' ')[0] ?? 'Student'
  const active = items.filter(
    (t) => t.status === 'open' || t.status === 'in_progress',
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Welcome back, {firstName}</h1>
          <p>Here&apos;s an overview of your campus support requests.</p>
        </div>
        <ButtonLink to={ROUTES.ticketNew}>
          <IconPlus width={18} height={18} />
          New Ticket
        </ButtonLink>
      </header>

      <section className={styles.stats} aria-label="Ticket summary">
        <article className={styles.statOpen}>
          <span>Open</span>
          <strong>{loading ? '…' : open}</strong>
        </article>
        <article className={styles.statProgress}>
          <span>In progress</span>
          <strong>{loading ? '…' : inProgress}</strong>
        </article>
        <article className={styles.statResolved}>
          <span>Resolved</span>
          <strong>{loading ? '…' : resolved}</strong>
        </article>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Active tickets</h2>
            <Link to={ROUTES.tickets}>View all</Link>
          </div>
          {active.length === 0 && !loading ? (
            <p className={styles.empty}>No active tickets right now.</p>
          ) : (
            <ul className={styles.list}>
              {(active.length ? active : items).slice(0, 5).map((ticket) => (
                <li key={ticket.id}>
                  <Link to={ticketDetailPath(ticket.id)} className={styles.item}>
                    <div className={styles.itemTop}>
                      <strong>{ticket.subject}</strong>
                      <time dateTime={ticket.updatedAt}>
                        {relativeTime(ticket.updatedAt)}
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
            <h2>Suggested articles</h2>
            <ul className={styles.articles}>
              <li>
                <Link to={ROUTES.faq}>
                  I forgot my university password.
                  <span aria-hidden="true">›</span>
                </Link>
              </li>
              <li>
                <Link to={ROUTES.faq}>
                  How do I connect to the campus Wi-Fi?
                  <span aria-hidden="true">›</span>
                </Link>
              </li>
              <li>
                <Link to={ROUTES.faq}>
                  When is the tuition fee payment deadline?
                  <span aria-hidden="true">›</span>
                </Link>
              </li>
            </ul>
          </section>

          <section className={styles.aiCard}>
            <h2>Need a quick answer?</h2>
            <p>Ask our AI Assistant, available 24/7 for common campus questions.</p>
            <ButtonLink to={ROUTES.assistant} variant="secondary">
              Open Chat
            </ButtonLink>
          </section>
        </aside>
      </div>
    </div>
  )
}
