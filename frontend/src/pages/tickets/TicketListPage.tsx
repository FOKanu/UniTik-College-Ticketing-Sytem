import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { useTicketStore } from '@/stores'
import type { Department, TicketStatus } from '@/types'
import styles from './TicketListPage.module.css'

function relativeTime(iso: string, t: (key: string, options?: { count: number }) => string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return t('time.minute', { count: Math.max(mins, 1) })
  const hours = Math.round(mins / 60)
  if (hours < 24) return t('time.hour', { count: hours })
  const days = Math.round(hours / 24)
  if (days < 7) return t('time.day', { count: days })
  return t('time.week', { count: Math.round(days / 7) })
}

export function TicketListPage() {
  const { t } = useTranslation()
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
          <p>{t('tickets.track')}</p>
        </div>
        <ButtonLink to={ROUTES.ticketNew}>
          <IconPlus width={18} height={18} />
          {t('tickets.new')}
        </ButtonLink>
      </header>

      <div className={styles.toolbar}>
        <Select
          id="status-filter"
          aria-label={t('common.status')}
          value={filters.status ?? 'all'}
          onChange={(e) =>
            setFilters({ status: e.target.value as TicketStatus | 'all' })
          }
          options={[
            { value: 'all', label: t('tickets.statusAll') },
            { value: 'open', label: t('common.open') },
            { value: 'in_progress', label: t('common.inProgress') },
            { value: 'resolved', label: t('common.resolved') },
            { value: 'closed', label: t('tickets.closed') },
          ]}
        />
        <Select
          id="dept-filter"
          aria-label={t('tickets.department')}
          value={filters.department ?? 'all'}
          onChange={(e) =>
            setFilters({
              department: e.target.value as Department | 'all',
            })
          }
          options={[
            { value: 'all', label: t('tickets.departmentAll') },
            { value: 'Academics', label: 'Academics' },
            { value: 'IT', label: 'IT' },
            { value: 'Finance', label: 'Finance' },
            { value: 'Maintenance', label: 'Maintenance' },
          ]}
        />
        <SearchField
          id="ticket-search"
          placeholder={t('tickets.search')}
          value={filters.query ?? ''}
          onChange={(e) => setFilters({ query: e.target.value })}
          className={styles.search}
        />
      </div>

      {error ? <p className={styles.empty} role="alert">{error}</p> : null}

      <div
        className={styles.tableWrap}
        aria-busy={loading}
        aria-label={t('tickets.results')}
      >
        <table className={styles.table}>
          <caption className="sr-only">{t('tickets.supportTickets')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('tickets.id')}</th>
              <th scope="col">{t('tickets.titleLabel')}</th>
              <th scope="col">{t('tickets.department')}</th>
              <th scope="col">{t('common.status')}</th>
              <th scope="col">{t('tickets.priorityLabel')}</th>
              <th scope="col">{t('tickets.updated')}</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              items.map((ticket) => (
                <tr key={ticket.id}>
                  <td className={styles.idCell}>{ticket.id}</td>
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
          <p className={styles.empty}>{t('tickets.noMatch')}</p>
        ) : null}
      </div>

      <nav className={styles.pager} aria-label={t('tickets.pagination')}>
        <span aria-live="polite">
          {t('tickets.showing', { from, to, total })}
        </span>
        <div>
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
            aria-label={t('tickets.previous')}
          >
            {t('tickets.prev')}
          </Button>
          <Button
            size="sm"
            disabled={to >= total || loading}
            onClick={() => setPage(page + 1)}
            aria-label={t('tickets.nextPage')}
          >
            {t('tickets.next')}
          </Button>
        </div>
      </nav>
    </div>
  )
}
