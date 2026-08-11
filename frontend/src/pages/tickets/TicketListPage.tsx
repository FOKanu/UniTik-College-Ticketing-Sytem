import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, ticketDetailPath } from '@/app/routes'
import {
  Button,
  ButtonLink,
  DepartmentBadge,
  PriorityBadge,
  SearchField,
  Select,
  StatusBadge,
} from '@/components/ui'
import { IconPlus } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { useTicketStore } from '@/stores'
import type { Department, TicketStatus } from '@/types'
import styles from './TicketListPage.module.css'

function relativeTime(
  iso: string,
  t: ReturnType<typeof useT>,
): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return t('time.minutesAgo', { n: Math.max(mins, 1) })
  const hours = Math.round(mins / 60)
  if (hours < 24) return t('time.hoursAgo', { n: hours })
  const days = Math.round(hours / 24)
  if (days < 7) return t('time.daysAgo', { n: days })
  return t('time.weeksAgo', { n: Math.round(days / 7) })
}

export function TicketListPage() {
  const t = useT()
  const items = useTicketStore((s) => s.items)
  const total = useTicketStore((s) => s.total)
  const page = useTicketStore((s) => s.page)
  const pageSize = useTicketStore((s) => s.pageSize)
  const scope = useTicketStore((s) => s.scope)
  const filters = useTicketStore((s) => s.filters)
  const loading = useTicketStore((s) => s.loading)
  const error = useTicketStore((s) => s.error)
  const setScope = useTicketStore((s) => s.setScope)
  const setFilters = useTicketStore((s) => s.setFilters)
  const setPage = useTicketStore((s) => s.setPage)
  const fetchList = useTicketStore((s) => s.fetchList)

  useEffect(() => {
    setScope('mine')
  }, [setScope])

  useEffect(() => {
    void fetchList()
  }, [fetchList, filters, page, pageSize, scope])

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t('tickets.title')}</h1>
          <p>{t('tickets.subtitle')}</p>
        </div>
        <ButtonLink to={ROUTES.ticketNew}>
          <IconPlus width={18} height={18} />
          {t('dash.newTicket')}
        </ButtonLink>
      </header>

      <div className={styles.toolbar}>
        <Select
          id="status-filter"
          aria-label={t('filter.status')}
          value={filters.status ?? 'all'}
          onChange={(e) =>
            setFilters({ status: e.target.value as TicketStatus | 'all' })
          }
          options={[
            { value: 'all', label: t('filter.statusAll') },
            { value: 'open', label: t('status.open') },
            { value: 'in_progress', label: t('status.in_progress') },
            { value: 'resolved', label: t('status.resolved') },
            { value: 'closed', label: t('status.closed') },
          ]}
        />
        <Select
          id="dept-filter"
          aria-label={t('filter.department')}
          value={filters.department ?? 'all'}
          onChange={(e) =>
            setFilters({
              department: e.target.value as Department | 'all',
            })
          }
          options={[
            { value: 'all', label: t('filter.departmentAll') },
            { value: 'Academics', label: t('dept.Academics') },
            { value: 'IT', label: t('dept.IT') },
            { value: 'Finance', label: t('dept.Finance') },
            { value: 'Maintenance', label: t('dept.Maintenance') },
          ]}
        />
        <SearchField
          id="ticket-search"
          placeholder={t('filter.searchTickets')}
          value={filters.query ?? ''}
          onChange={(e) => setFilters({ query: e.target.value })}
          className={styles.search}
        />
      </div>

      {error ? <p className={styles.empty} role="alert">{error}</p> : null}

      <div
        className={styles.tableWrap}
        aria-busy={loading}
        aria-label={t('tickets.resultsAria')}
      >
        <table className={styles.table}>
          <caption className="sr-only">{t('tickets.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('table.id')}</th>
              <th scope="col">{t('table.title')}</th>
              <th scope="col">{t('table.department')}</th>
              <th scope="col">{t('table.status')}</th>
              <th scope="col">{t('table.priority')}</th>
              <th scope="col">{t('table.updated')}</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              items.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <Link to={ticketDetailPath(ticket.id)}>{ticket.id}</Link>
                  </td>
                  <td>
                    <Link to={ticketDetailPath(ticket.id)}>
                      {ticket.subject}
                    </Link>
                  </td>
                  <td>
                    <DepartmentBadge department={ticket.category} />
                  </td>
                  <td>
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td>
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td>{relativeTime(ticket.updatedAt, t)}</td>
                </tr>
              ))}
          </tbody>
        </table>
        {loading ? (
          <p className={styles.empty} aria-live="polite">
            {t('tickets.loading')}
          </p>
        ) : null}
        {!loading && !error && total === 0 ? (
          <p className={styles.empty}>{t('tickets.empty')}</p>
        ) : null}
      </div>

      <nav className={styles.pager} aria-label="Pagination">
        <span aria-live="polite">
          {t('pager.showing', { from, to, total })}
        </span>
        <div>
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
            aria-label={t('pager.prevAria')}
          >
            {t('pager.prev')}
          </Button>
          <Button
            size="sm"
            disabled={to >= total || loading}
            onClick={() => setPage(page + 1)}
            aria-label={t('pager.nextAria')}
          >
            {t('pager.next')}
          </Button>
        </div>
      </nav>
    </div>
  )
}
