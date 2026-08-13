import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES, agentTicketDetailPath } from '@/app/routes'
import {
  Button,
  ButtonLink,
  PriorityBadge,
  SearchField,
  Select,
  SlaBadge,
  StatusBadge,
  Badge,
} from '@/components/ui'
import { usersApi, type StaffMember } from '@/lib/api'
import { useAuthStore, useTicketStore } from '@/stores'
import type { Department, TicketPriority, TicketStatus } from '@/types'
import styles from './QueuePage.module.css'

type AssigneeTab = 'all' | 'me' | 'unassigned'

export function QueuePage() {
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
            : t('agentDetail.staffLoadError'),
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

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
  const assignVerb = t(hasAssigned ? 'queue.reassign' : 'queue.assign')

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
      return t('queue.bulkSuccess', { action, count })
    }
    return t('queue.bulkPartial', {
      action,
      succeeded: count - failures,
      count,
      failures,
    })
  }

  async function assignTo(member: StaffMember | null) {
    const ids = [...selected]
    setAssignOpen(false)
    setBulkMessage(null)
    const result = await bulkUpdate(ids, { assignedTo: member?.id ?? null })
    setBulkMessage(
      describe(
        member
          ? t(hasAssigned ? 'queue.reassignedTo' : 'queue.assignedTo', {
              name: member.displayName,
            })
          : t('queue.unassignedAction'),
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
    setBulkMessage(
      describe(t('queue.closedAction'), ids.length, result.failed.length),
    )
    setSelected(result.failed.map((f) => f.id))
    await fetchList()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{t('nav.queue')}</h1>
        <ButtonLink to={ROUTES.agentTicketNew}>+ {t('tickets.create')}</ButtonLink>
      </header>

      <div className={styles.tabs} role="tablist" aria-label={t('queue.assigneeFilter')}>
        {(
          [
            { id: 'all', label: t('common.all') },
            { id: 'me', label: t('queue.assignedMe') },
            { id: 'unassigned', label: t('common.unassigned') },
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
            { value: 'closed', label: t('common.closed') },
          ]}
        />
        <Select
          id="q-dept"
          aria-label={t('tickets.department')}
          value={filters.department ?? 'all'}
          onChange={(e) =>
            setFilters({
              department: e.target.value as Department | 'all',
            })
          }
          options={[
            { value: 'all', label: t('tickets.departmentAll') },
            { value: 'Academics', label: t('departments.academics') },
            { value: 'IT', label: 'IT' },
            { value: 'Finance', label: t('departments.finance') },
            { value: 'Maintenance', label: t('departments.maintenance') },
          ]}
        />
        <Select
          id="q-priority"
          aria-label={t('tickets.priority')}
          value={filters.priority ?? 'all'}
          onChange={(e) =>
            setFilters({
              priority: e.target.value as TicketPriority | 'all',
            })
          }
          options={[
            { value: 'all', label: t('queue.priorityAll') },
            { value: 'high', label: t('common.high') },
            { value: 'medium', label: t('common.medium') },
            { value: 'low', label: t('common.low') },
            { value: 'urgent', label: t('common.urgent') },
          ]}
        />
        <SearchField
          id="queue-search"
          placeholder={t('tickets.search')}
          value={filters.query ?? ''}
          onChange={(e) => setFilters({ query: e.target.value })}
          className={styles.search}
        />
      </div>

      {selected.length > 0 ? (
        <div className={styles.bulk}>
          <span>{t('queue.selected', { count: selected.length })}</span>

          <div className={styles.assignWrap} ref={assignRef}>
            <Button
              variant="secondary"
              size="sm"
              aria-haspopup="menu"
              aria-expanded={assignOpen}
              disabled={mutating || !!staffError}
              onClick={() => setAssignOpen((v) => !v)}
            >
              {mutating ? t('queue.working') : assignVerb}
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
                    {t('queue.assignMe')}
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
                    {t('queue.noStaff')}
                  </p>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  className={styles.assignItem}
                  onClick={() => void assignTo(null)}
                >
                  {t('queue.clearAssignee')}
                </button>
              </div>
            ) : null}
          </div>

          <Button
            size="sm"
            disabled={mutating}
            onClick={() => setConfirmClose(true)}
          >
            {t('queue.closeSelected')}
          </Button>

          <button
            type="button"
            className={styles.clearSelection}
            onClick={() => setSelected([])}
          >
            {t('queue.clear')}
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
              {t('queue.closeTitle', { count: selected.length })}
            </h2>
            <p>
              {t('queue.closeBody')}
            </p>
            <div className={styles.confirmActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmClose(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                disabled={mutating}
                onClick={() => void closeSelected()}
              >
                {mutating ? t('queue.closing') : t('queue.closeTickets')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p role="alert">{error}</p> : null}

      <div
        className={styles.tableWrap}
        aria-busy={loading}
        aria-label={t('queue.results')}
      >
        <table className={styles.table}>
          <caption className="sr-only">{t('queue.caption')}</caption>
          <thead>
            <tr>
              <th scope="col" aria-label={t('queue.select')} />
              <th scope="col">{t('tickets.id')}</th>
              <th scope="col">{t('tickets.titleLabel')}</th>
              <th scope="col">{t('tickets.department')}</th>
              <th scope="col">{t('tickets.priority')}</th>
              <th scope="col">{t('common.status')}</th>
              <th scope="col">{t('queue.assignee')}</th>
              <th scope="col">{t('agentDashboard.sla')}</th>
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
                      aria-label={t('queue.selectId', { id: ticket.id })}
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
                  <td>
                    {ticket.assignedTo ? (
                      (ticket.assignedName ?? t('queue.assigned'))
                    ) : (
                      <Badge tone="warn">{t('common.unassigned')}</Badge>
                    )}
                  </td>
                  <td>
                    <SlaBadge
                      hoursRemaining={ticket.slaHoursRemaining}
                      breached={ticket.slaBreached}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {loading ? (
          <p className={styles.loading} aria-live="polite">
            {t('queue.loading')}
          </p>
        ) : null}
        {!loading && items.length === 0 ? (
          <p className={styles.empty}>{t('queue.empty')}</p>
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
