import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, agentTicketDetailPath } from '@/app/routes'
import {
  Button,
  ButtonLink,
  PriorityBadge,
  SearchField,
  Select,
  StatusBadge,
} from '@/components/ui'
import { useAuthStore, useTicketStore, useUiStore } from '@/stores'
import type { Department, TicketPriority, TicketStatus } from '@/types'
import styles from './QueuePage.module.css'

type AssigneeTab = 'all' | 'me' | 'unassigned'

export function QueuePage() {
  const user = useAuthStore((s) => s.user)
  const items = useTicketStore((s) => s.items)
  const total = useTicketStore((s) => s.total)
  const page = useTicketStore((s) => s.page)
  const pageSize = useTicketStore((s) => s.pageSize)
  const scope = useTicketStore((s) => s.scope)
  const filters = useTicketStore((s) => s.filters)
  const loading = useTicketStore((s) => s.loading)
  const mutating = useTicketStore((s) => s.mutating)
  const error = useTicketStore((s) => s.error)
  const setScope = useTicketStore((s) => s.setScope)
  const setFilters = useTicketStore((s) => s.setFilters)
  const setPage = useTicketStore((s) => s.setPage)
  const fetchList = useTicketStore((s) => s.fetchList)
  const updateTicket = useTicketStore((s) => s.updateTicket)
  const pushToast = useUiStore((s) => s.pushToast)
  const [selected, setSelected] = useState<string[]>([])
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const assigneeTab = (filters.assignee ?? 'all') as AssigneeTab

  useEffect(() => {
    setScope('queue')
  }, [setScope])

  useEffect(() => {
    void fetchList()
  }, [fetchList, filters, page, pageSize, scope])

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function setAssigneeTab(tab: AssigneeTab) {
    setFilters({ assignee: tab })
  }

  async function claimTicket(ticketId: string) {
    if (!user) return
    setClaimingId(ticketId)
    const updated = await updateTicket(ticketId, {
      assignedTo: user.id,
      assignedName: user.displayName,
      status: 'in_progress',
    })
    setClaimingId(null)
    if (updated) {
      pushToast({
        title: 'Ticket assigned',
        body: `${ticketId} is now assigned to you.`,
        tone: 'success',
      })
      void fetchList()
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Ticket Queue</h1>
        <ButtonLink to={ROUTES.agentTicketNew}>+ Create ticket</ButtonLink>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Assignee filter">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'me', label: 'Assigned' },
            { id: 'unassigned', label: 'Unassigned' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={assigneeTab === tab.id}
            className={assigneeTab === tab.id ? styles.tabActive : styles.tab}
            onClick={() => setAssigneeTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <Select
          id="q-status"
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
          id="q-dept"
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
        <Select
          id="q-priority"
          aria-label="Priority"
          value={filters.priority ?? 'all'}
          onChange={(e) =>
            setFilters({
              priority: e.target.value as TicketPriority | 'all',
            })
          }
          options={[
            { value: 'all', label: 'Priority: All' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
            { value: 'urgent', label: 'Urgent' },
          ]}
        />
        <SearchField
          id="queue-search"
          placeholder="Search tickets..."
          value={filters.query ?? ''}
          onChange={(e) => setFilters({ query: e.target.value })}
          className={styles.search}
        />
      </div>

      {selected.length > 0 ? (
        <div className={styles.bulk}>
          <span>{selected.length} selected</span>
          <Button variant="secondary" size="sm" disabled>
            Assign
          </Button>
          <Button size="sm" disabled>
            Close selected
          </Button>
        </div>
      ) : null}

      {error ? <p role="alert">{error}</p> : null}

      <div
        className={styles.tableWrap}
        aria-busy={loading}
        aria-label="Queue results"
      >
        <table className={styles.table}>
          <caption className="sr-only">Staff ticket queue</caption>
          <thead>
            <tr>
              <th scope="col" aria-label="Select" />
              <th scope="col">ID</th>
              <th scope="col">Title</th>
              <th scope="col">Department</th>
              <th scope="col">Priority</th>
              <th scope="col">Status</th>
              <th scope="col">Assignee</th>
              <th scope="col">SLA</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              items.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(ticket.id)}
                      onChange={() => toggle(ticket.id)}
                      aria-label={`Select ${ticket.id}`}
                    />
                  </td>
                  <td>
                    <Link to={agentTicketDetailPath(ticket.id)}>
                      {ticket.id}
                    </Link>
                  </td>
                  <td>
                    <Link to={agentTicketDetailPath(ticket.id)}>
                      {ticket.subject}
                    </Link>
                  </td>
                  <td>{ticket.category}</td>
                  <td>
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td>
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td>{ticket.assignedName ?? 'Unassigned'}</td>
                  <td>
                    {ticket.slaHoursRemaining != null
                      ? `${ticket.slaHoursRemaining}h`
                      : '—'}
                  </td>
                  <td>
                    {!ticket.assignedTo ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={mutating || claimingId === ticket.id}
                        onClick={() => void claimTicket(ticket.id)}
                      >
                        {claimingId === ticket.id ? 'Assigning…' : 'Assign to me'}
                      </Button>
                    ) : (
                      <Link
                        className={styles.reassignLink}
                        to={agentTicketDetailPath(ticket.id)}
                      >
                        Reassign
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {loading ? (
          <p className={styles.loading} aria-live="polite">
            Loading queue…
          </p>
        ) : null}
        {!loading && items.length === 0 ? (
          <p className={styles.empty}>No tickets match these filters.</p>
        ) : null}
      </div>

      <nav className={styles.pager} aria-label="Pagination">
        <span aria-live="polite">
          Showing {from}-{to} of {total}
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
