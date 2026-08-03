import { useEffect, useMemo, useRef, useState } from 'react'
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
import { usersApi, type StaffMember } from '@/lib/api'
import { useAuthStore, useTicketStore } from '@/stores'
import type { Department, TicketPriority, TicketStatus } from '@/types'
import styles from './QueuePage.module.css'

type AssigneeTab = 'all' | 'me' | 'unassigned'

export function QueuePage() {
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
  const bulkUpdate = useTicketStore((s) => s.bulkUpdate)
  const mutating = useTicketStore((s) => s.mutating)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [selected, setSelected] = useState<string[]>([])

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [staffError, setStaffError] = useState<string | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [bulkMessage, setBulkMessage] = useState<string | null>(null)
  const assignRef = useRef<HTMLDivElement>(null)

  const assigneeTab = (filters.assignee ?? 'all') as AssigneeTab

  useEffect(() => {
    setScope('queue')
  }, [setScope])

  useEffect(() => {
    void fetchList()
  }, [fetchList, filters, page, pageSize, scope])

  // Staff directory powers the assign picker. Staff/admin only — the route
  // 403s for students, who never reach this page anyway.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const members = await usersApi.listStaff()
        if (cancelled) return
        setStaff(members)
        setStaffError(null)
      } catch (err) {
        if (cancelled) return
        setStaff([])
        setStaffError(
          err instanceof Error
            ? err.message
            : 'Could not load the staff directory.',
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!assignOpen) return
    function onPointerDown(event: MouseEvent) {
      if (assignRef.current?.contains(event.target as Node)) return
      setAssignOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAssignOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [assignOpen])

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  const selectedTickets = useMemo(
    () => items.filter((ticket) => selected.includes(ticket.id)),
    [items, selected],
  )

  // When every selected ticket shares a department, surface that team first.
  const sharedDepartment = useMemo(() => {
    const departments = new Set(selectedTickets.map((t) => t.category))
    return departments.size === 1 ? [...departments][0] : null
  }, [selectedTickets])

  // Any already-assigned ticket in the selection makes this a reassignment.
  const hasAssigned = useMemo(
    () => selectedTickets.some((ticket) => !!ticket.assignedTo),
    [selectedTickets],
  )
  const assignVerb = hasAssigned ? 'Reassign' : 'Assign'

  const assignOptions = useMemo(() => {
    if (!sharedDepartment) return staff
    const matches = staff.filter((member) =>
      (member.department ?? '')
        .toLowerCase()
        .includes(sharedDepartment.toLowerCase()),
    )
    return matches.length > 0 ? matches : staff
  }, [staff, sharedDepartment])

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function setAssigneeTab(tab: AssigneeTab) {
    setFilters({ assignee: tab })
  }

  function describe(action: string, count: number, failures: number): string {
    if (failures === 0) {
      return `${action} ${count} ticket${count === 1 ? '' : 's'}.`
    }
    return `${action} ${count - failures} of ${count} tickets — ${failures} failed.`
  }

  async function assignTo(member: StaffMember | null) {
    const ids = [...selected]
    setAssignOpen(false)
    setBulkMessage(null)
    const result = await bulkUpdate(ids, { assignedTo: member?.id ?? null })
    setBulkMessage(
      describe(
        member
          ? `${hasAssigned ? 'Reassigned' : 'Assigned'} to ${member.displayName} —`
          : 'Unassigned',
        ids.length,
        result.failed.length,
      ),
    )
    setSelected(result.failed.map((f) => f.id))
    await fetchList()
  }

  async function closeSelected() {
    const ids = [...selected]
    setConfirmClose(false)
    setBulkMessage(null)
    const result = await bulkUpdate(ids, { status: 'closed' })
    setBulkMessage(describe('Closed', ids.length, result.failed.length))
    setSelected(result.failed.map((f) => f.id))
    await fetchList()
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
            { id: 'me', label: 'Assigned to me' },
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

          <div className={styles.assignWrap} ref={assignRef}>
            <Button
              variant="secondary"
              size="sm"
              aria-haspopup="menu"
              aria-expanded={assignOpen}
              disabled={mutating || !!staffError}
              onClick={() => setAssignOpen((v) => !v)}
            >
              {mutating ? 'Working…' : assignVerb}
            </Button>

            {assignOpen ? (
              <div className={styles.assignMenu} role="menu">
                <p className={styles.assignHint}>
                  {sharedDepartment
                    ? `${sharedDepartment} team`
                    : 'Mixed departments — showing all staff'}
                </p>
                {currentUserId && staff.some((m) => m.id === currentUserId) ? (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.assignItem}
                    onClick={() =>
                      void assignTo(
                        staff.find((m) => m.id === currentUserId) ?? null,
                      )
                    }
                  >
                    Assign to me
                  </button>
                ) : null}
                {assignOptions
                  .filter((member) => member.id !== currentUserId)
                  .map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      role="menuitem"
                      className={styles.assignItem}
                      onClick={() => void assignTo(member)}
                    >
                      <span>{member.displayName}</span>
                      {member.department ? (
                        <small>{member.department}</small>
                      ) : null}
                    </button>
                  ))}
                {assignOptions.length === 0 ? (
                  <p className={styles.assignHint}>
                    No staff accounts available to assign.
                  </p>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  className={styles.assignItem}
                  onClick={() => void assignTo(null)}
                >
                  Clear assignee
                </button>
              </div>
            ) : null}
          </div>

          <Button
            size="sm"
            disabled={mutating}
            onClick={() => setConfirmClose(true)}
          >
            Close selected
          </Button>

          <button
            type="button"
            className={styles.clearSelection}
            onClick={() => setSelected([])}
          >
            Clear
          </button>
        </div>
      ) : null}

      {staffError && selected.length > 0 ? (
        <p className={styles.bulkNote} role="alert">
          {staffError} Assigning is unavailable until it loads.
        </p>
      ) : null}

      {bulkMessage ? (
        <p className={styles.bulkNote} role="status">
          {bulkMessage}
        </p>
      ) : null}

      {confirmClose ? (
        <div
          className={styles.confirm}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-close-title"
        >
          <div className={styles.confirmBox}>
            <h2 id="confirm-close-title">
              Close {selected.length} ticket{selected.length === 1 ? '' : 's'}?
            </h2>
            <p>
              Requesters can still reopen a closed ticket by replying to it.
              This cannot be undone in bulk.
            </p>
            <div className={styles.confirmActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmClose(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={mutating}
                onClick={() => void closeSelected()}
              >
                {mutating ? 'Closing…' : 'Close tickets'}
              </Button>
            </div>
          </div>
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
