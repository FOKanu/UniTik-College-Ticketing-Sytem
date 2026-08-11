import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import {
  Button,
  ButtonLink,
  DepartmentBadge,
  PriorityBadge,
  Select,
  SlaBadge,
  StatusBadge,
  Textarea,
  Toggle,
} from '@/components/ui'
import { TicketAttachments } from '@/components/tickets/TicketAttachments'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usersApi, type StaffMember } from '@/lib/api'
import { useT, type MessageKey } from '@/lib/i18n'
import { useAuthStore, useTicketStore } from '@/stores'
import type { Department, TicketPriority, TicketStatus } from '@/types'
import styles from './AgentTicketDetailPage.module.css'

const DEPARTMENTS: Department[] = ['Academics', 'IT', 'Finance', 'Maintenance']

const deptKey: Record<Department, MessageKey> = {
  Academics: 'dept.Academics',
  IT: 'dept.IT',
  Finance: 'dept.Finance',
  Maintenance: 'dept.Maintenance',
}

function RoutingPanel({
  ticketId,
  category,
  assignedTo,
  assignedName,
  staff,
  staffError,
  currentUserId,
  mutating,
}: {
  ticketId: string
  category: Department
  assignedTo?: string
  assignedName?: string
  staff: StaffMember[]
  staffError: string | null
  currentUserId?: string
  mutating: boolean
}) {
  const t = useT()
  const updateTicket = useTicketStore((s) => s.updateTicket)
  const [routeDepartment, setRouteDepartment] = useState<Department>(category)
  const [routeAssignee, setRouteAssignee] = useState(assignedTo ?? '')
  const [routingMessage, setRoutingMessage] = useState<string | null>(null)

  const assigneeOptions = [
    { value: '', label: t('ticket.unassigned') },
    ...staff.map((member) => ({
      value: member.id,
      label:
        member.id === currentUserId
          ? t('ticket.meSuffix', { name: member.displayName })
          : member.department
            ? `${member.displayName} · ${member.department}`
            : member.displayName,
    })),
  ]

  async function reassignTicket(event: FormEvent) {
    event.preventDefault()
    setRoutingMessage(null)
    const assigneeName =
      routeAssignee === ''
        ? null
        : (staff.find((m) => m.id === routeAssignee)?.displayName ?? null)
    const updated = await updateTicket(ticketId, {
      category: routeDepartment,
      assignedTo: routeAssignee || null,
    })
    if (!updated) {
      setRoutingMessage(
        useTicketStore.getState().error ?? t('ticket.reassignFailed'),
      )
      return
    }
    useTicketStore.setState((state) => {
      if (state.selected?.id !== ticketId) return state
      return {
        selected: {
          ...state.selected,
          assignedName: assigneeName ?? undefined,
        },
      }
    })
    setRoutingMessage(
      routeAssignee
        ? t('ticket.routedTo', {
            name: assigneeName ?? t('ticket.selectedStaff'),
          })
        : t('ticket.leftUnassigned'),
    )
  }

  return (
    <form
      className={styles.routing}
      onSubmit={(e) => void reassignTicket(e)}
      aria-label={t('ticket.routeAria')}
    >
      <h2>{t('ticket.routeTitle')}</h2>
      <Select
        id="route-department"
        label={t('table.department')}
        value={routeDepartment}
        onChange={(e) => {
          setRouteDepartment(e.target.value as Department)
          setRoutingMessage(null)
        }}
        options={DEPARTMENTS.map((dept) => ({
          value: dept,
          label: t(deptKey[dept]),
        }))}
      />
      <Select
        id="route-assignee"
        label={t('table.assignee')}
        value={routeAssignee}
        onChange={(e) => {
          setRouteAssignee(e.target.value)
          setRoutingMessage(null)
        }}
        options={
          routeAssignee &&
          !assigneeOptions.some((option) => option.value === routeAssignee)
            ? [
                ...assigneeOptions,
                {
                  value: routeAssignee,
                  label: assignedName
                    ? t('ticket.currentNamed', { name: assignedName })
                    : t('ticket.currentAssignee'),
                },
              ]
            : assigneeOptions
        }
      />
      {staffError ? (
        <p className={styles.routingError} role="alert">
          {staffError}
        </p>
      ) : null}
      {routingMessage ? (
        <p className={styles.routingStatus} role="status">
          {routingMessage}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={mutating || !!staffError}>
        {t('ticket.reassign')}
      </Button>
    </form>
  )
}

export function AgentTicketDetailPage() {
  const t = useT()
  const { ticketId } = useParams()
  const currentUser = useAuthStore((s) => s.user)
  const ticket = useTicketStore((s) => s.selected)
  const loading = useTicketStore((s) => s.detailLoading)
  const mutating = useTicketStore((s) => s.mutating)
  const error = useTicketStore((s) => s.error)
  const fetchById = useTicketStore((s) => s.fetchById)
  const updateTicket = useTicketStore((s) => s.updateTicket)
  const addComment = useTicketStore((s) => s.addComment)

  const [reply, setReply] = useState('')
  const [resolution, setResolution] = useState('')
  const [internalNote, setInternalNote] = useState(false)
  const [showAi, setShowAi] = useState(true)

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [staffError, setStaffError] = useState<string | null>(null)

  usePageTitle(
    ticket ? `${ticket.id}: ${ticket.subject}` : t('ticket.detailTitle'),
  )

  useEffect(() => {
    if (ticketId) void fetchById(ticketId)
  }, [ticketId, fetchById])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const members = await usersApi.listStaff()
        if (!cancelled) {
          setStaff(members)
          setStaffError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setStaff([])
          setStaffError(
            err instanceof Error
              ? err.message
              : 'Could not load staff directory.',
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading && !ticket) {
    return (
      <p className={styles.missing} aria-live="polite">
        {t('ticket.loading')}
      </p>
    )
  }

  if (!ticket) {
    return (
      <div className={styles.missing}>
        <h1>{t('ticket.notFound')}</h1>
        {error ? <p role="alert">{error}</p> : null}
        <ButtonLink to={ROUTES.queue}>{t('ticket.backQueue')}</ButtonLink>
      </div>
    )
  }

  const status = ticket.status
  const priority = ticket.priority
  const assigneeLabel =
    staff.find((m) => m.id === ticket.assignedTo)?.displayName ??
    ticket.assignedName ??
    (ticket.assignedTo ? t('table.assigned') : t('ticket.unassigned'))

  async function sendReply(event: FormEvent) {
    event.preventDefault()
    if (!reply.trim() || !ticket) return
    const ok = await addComment(ticket.id, {
      body: reply.trim(),
      internal: internalNote || undefined,
    })
    if (ok) {
      setReply('')
      setInternalNote(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link to={ROUTES.queue} className={styles.back}>
            ← {t('ticket.backQueue')}
          </Link>
          <h1>{ticket.subject}</h1>
          <p className={styles.ticketId}>{ticket.id}</p>
          <div className={styles.badges}>
            <DepartmentBadge department={ticket.category} />
            <StatusBadge status={status} />
            <PriorityBadge priority={priority} />
          </div>
        </div>
        <div className={styles.controls}>
          <Select
            id="agent-status"
            label={t('table.status')}
            value={status}
            onChange={(e) => {
              void updateTicket(ticket.id, {
                status: e.target.value as TicketStatus,
              })
            }}
            options={[
              { value: 'open', label: t('status.open') },
              { value: 'in_progress', label: t('status.in_progress') },
              {
                value: 'waiting_on_student',
                label: t('status.waiting_on_student'),
              },
              { value: 'resolved', label: t('status.resolved') },
              { value: 'closed', label: t('status.closed') },
            ]}
          />
          <Select
            id="agent-priority"
            label={t('table.priority')}
            value={priority}
            onChange={(e) => {
              void updateTicket(ticket.id, {
                priority: e.target.value as TicketPriority,
              })
            }}
            options={[
              { value: 'low', label: t('priority.low') },
              { value: 'medium', label: t('priority.medium') },
              { value: 'high', label: t('priority.high') },
              { value: 'urgent', label: t('priority.urgent') },
            ]}
          />
          <Button
            disabled={mutating}
            onClick={() => {
              void updateTicket(ticket.id, {
                status: 'resolved',
                resolutionSummary: resolution || undefined,
              })
            }}
          >
            {t('ticket.resolve')}
          </Button>
        </div>
      </header>

      <div className={styles.grid}>
        <aside className={styles.meta} aria-label={t('ticket.detailsAria')}>
          <h2>{t('ticket.requester')}</h2>
          <dl>
            <div>
              <dt>{t('ticket.name')}</dt>
              <dd>{ticket.requesterName}</dd>
            </div>
            {ticket.requesterEmail ? (
              <div>
                <dt>{t('profile.email')}</dt>
                <dd>
                  <small>{ticket.requesterEmail}</small>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>{t('table.department')}</dt>
              <dd>
                <DepartmentBadge department={ticket.category} />
              </dd>
            </div>
            <div>
              <dt>{t('ticket.created')}</dt>
              <dd>{new Date(ticket.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>{t('table.assignee')}</dt>
              <dd>{assigneeLabel}</dd>
            </div>
            <div>
              <dt>{t('table.sla')}</dt>
              <dd>
                <SlaBadge
                  hoursRemaining={ticket.slaHoursRemaining}
                  breached={ticket.slaBreached}
                />
              </dd>
            </div>
          </dl>

          <RoutingPanel
            key={ticket.id}
            ticketId={ticket.id}
            category={ticket.category}
            assignedTo={ticket.assignedTo}
            assignedName={ticket.assignedName}
            staff={staff}
            staffError={staffError}
            currentUserId={currentUser?.id}
            mutating={mutating}
          />

          {ticket.description ? (
            <div className={styles.description}>
              <h2>{t('ticket.details')}</h2>
              <p>{ticket.description}</p>
            </div>
          ) : null}
          <TicketAttachments
            ticketId={ticket.id}
            attachments={ticket.attachments}
            dropzoneId="agent-ticket-attachment"
          />
        </aside>

        <section className={styles.main} aria-label={t('ticket.conversation')}>
          <div
            className={styles.messages}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label={t('ticket.messagesAria')}
          >
            {ticket.comments.map((item) => (
              <article
                key={item.id}
                className={
                  item.internal
                    ? styles.internal
                    : item.authorId?.startsWith('agent') ||
                        item.authorId?.startsWith('admin')
                      ? styles.staff
                      : styles.student
                }
                aria-label={
                  item.internal
                    ? t('ticket.internalSaid', { name: item.authorName })
                    : t('ticket.said', { name: item.authorName })
                }
              >
                <p>{item.body}</p>
                <footer>
                  {item.authorName}
                  {item.internal ? ` · ${t('ticket.internal')}` : ''}
                </footer>
              </article>
            ))}
          </div>

          {showAi ? (
            <div className={styles.aiSuggest}>
              <p>{t('ticket.aiSuggest')}</p>
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setReply(t('ticket.aiSuggestBody'))
                    setShowAi(false)
                  }}
                >
                  {t('ticket.useReply')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAi(false)}
                >
                  {t('ticket.dismiss')}
                </Button>
              </div>
            </div>
          ) : null}

          <form
            className={styles.composer}
            onSubmit={(e) => void sendReply(e)}
          >
            <Textarea
              id="agent-reply"
              label={
                internalNote
                  ? t('ticket.internalNote')
                  : t('ticket.replyToStudent')
              }
              rows={3}
              placeholder={
                internalNote
                  ? t('ticket.notePlaceholder')
                  : t('ticket.studentReplyPlaceholder')
              }
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className={styles.composerActions}>
              <Toggle
                id="internal-note"
                label={t('ticket.internalNote')}
                checked={internalNote}
                onChange={setInternalNote}
              />
              <Button type="submit" disabled={mutating || !reply.trim()}>
                {internalNote ? t('ticket.addNote') : t('ticket.sendReply')}
              </Button>
            </div>
          </form>

          <div className={styles.resolve}>
            <Textarea
              id="resolution"
              label={t('ticket.resolutionSummary')}
              placeholder={t('ticket.resolutionPlaceholder')}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
            <Button
              disabled={mutating}
              onClick={() => {
                void updateTicket(ticket.id, {
                  status: 'resolved',
                  resolutionSummary: resolution,
                })
              }}
            >
              {t('ticket.resolveNotify')}
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
