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
import { useTicketStore } from '@/stores'
import type { Department, TicketStatus } from '@/types'
import styles from './TicketListPage.module.css'

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.round(days / 7)}w ago`
}

export function TicketListPage() {
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
          <h1>My Tickets</h1>
          <p>Track and manage your support requests.</p>
        </div>
        <ButtonLink to={ROUTES.ticketNew}>
          <IconPlus width={18} height={18} />
          New Ticket
        </ButtonLink>
      </header>

      <div className={styles.toolbar}>
        <Select
          id="status-filter"
          aria-label="Status"
          value={filters.status ?? 'all'}
          onChange={(e) =>
            setFilters({ status: e.target.value as TicketStatus | 'all' })
          }
          options={[
            { value: 'all', label: 'Status: All' },
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
        <Select
          id="dept-filter"
          aria-label="Department"
          value={filters.department ?? 'all'}
          onChange={(e) =>
            setFilters({
              department: e.target.value as Department | 'all',
            })
          }
          options={[
            { value: 'all', label: 'Department: All' },
            { value: 'Academics', label: 'Academics' },
            { value: 'IT', label: 'IT' },
            { value: 'Finance', label: 'Finance' },
            { value: 'Maintenance', label: 'Maintenance' },
          ]}
        />
        <SearchField
          id="ticket-search"
          placeholder="Search tickets..."
          value={filters.query ?? ''}
          onChange={(e) => setFilters({ query: e.target.value })}
          className={styles.search}
        />
      </div>

      {error ? <p className={styles.empty} role="alert">{error}</p> : null}

      <div
        className={styles.tableWrap}
        aria-busy={loading}
        aria-label="Ticket results"
      >
        <table className={styles.table}>
          <caption className="sr-only">Your support tickets</caption>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Title</th>
              <th scope="col">Department</th>
              <th scope="col">Status</th>
              <th scope="col">Priority</th>
              <th scope="col">Updated</th>
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
                  <td>{relativeTime(ticket.updatedAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
        {loading ? (
          <p className={styles.empty} aria-live="polite">
            Loading tickets…
          </p>
        ) : null}
        {!loading && !error && total === 0 ? (
          <p className={styles.empty}>No tickets match your filters.</p>
        ) : null}
      </div>

      <nav className={styles.pager} aria-label="Pagination">
        <span aria-live="polite">
          Showing {from}–{to} of {total}
        </span>
        <div>
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
            aria-label="Previous page"
          >
            Prev
          </Button>
          <Button
            size="sm"
            disabled={to >= total || loading}
            onClick={() => setPage(page + 1)}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      </nav>
    </div>
  )
}
