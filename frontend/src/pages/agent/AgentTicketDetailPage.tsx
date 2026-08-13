import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { useAuthStore, useTicketStore } from '@/stores'
import type { Department, TicketPriority, TicketStatus } from '@/types'
import styles from './AgentTicketDetailPage.module.css'
import { browserLocale } from '@/i18n'

const DEPARTMENTS: Department[] = ['Academics', 'IT', 'Finance', 'Maintenance']

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
  const { t } = useTranslation()
  const updateTicket = useTicketStore((s) => s.updateTicket)
  const [routeDepartment, setRouteDepartment] = useState<Department>(category)
  const [routeAssignee, setRouteAssignee] = useState(assignedTo ?? '')
  const [routingMessage, setRoutingMessage] = useState<string | null>(null)

  const assigneeOptions = [
    { value: '', label: t('common.unassigned') },
    ...staff.map((member) => ({
      value: member.id,
      label:
        member.id === currentUserId
          ? `${member.displayName} (me)`
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
        useTicketStore.getState().error ?? t('agentDetail.failedReassign'),
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
        ? `Routed to ${assigneeName ?? 'selected staff'}.`
        : 'Ticket left unassigned.',
    )
  }

  return (
    <form
      className={styles.routing}
      onSubmit={(e) => void reassignTicket(e)}
      aria-label={t('agentDetail.reassign')}
    >
      <h2>{t('agentDetail.route')}</h2>
      <Select
        id="route-department"
        label={t('tickets.department')}
        value={routeDepartment}
        onChange={(e) => {
          setRouteDepartment(e.target.value as Department)
          setRoutingMessage(null)
        }}
        options={DEPARTMENTS.map((dept) => ({
          value: dept,
          label: t(`departments.${dept === 'IT' ? 'it' : dept.toLowerCase()}`),
        }))}
      />
      <Select
        id="route-assignee"
        label={t('agentDetail.assignee')}
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
                    ? `${assignedName} (current)`
                    : t('agentDetail.current'),
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
        {t('agentDetail.reassignButton')}
      </Button>
    </form>
  )
}

export function AgentTicketDetailPage() {
  const { t, i18n } = useTranslation()
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

  usePageTitle(ticket ? `${ticket.id}: ${ticket.subject}` : t('tickets.detailTitle'))

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
              : t('agentDetail.staffLoadError'),
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  if (loading && !ticket) {
    return (
      <p className={styles.missing} aria-live="polite">
        {t('tickets.loadingOne')}
      </p>
    )
  }

  if (!ticket) {
    return (
      <div className={styles.missing}>
        <h1>{t('tickets.notFound')}</h1>
        {error ? <p role="alert">{error}</p> : null}
        <ButtonLink to={ROUTES.queue}>{t('agentDetail.backQueue')}</ButtonLink>
      </div>
    )
  }

  const status = ticket.status
  const priority = ticket.priority
  const assigneeLabel =
    staff.find((m) => m.id === ticket.assignedTo)?.displayName ??
    ticket.assignedName ??
    (ticket.assignedTo ? 'Assigned' : 'Unassigned')

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
            ← {t('agentDetail.backQueue')}
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
            label={t('common.status')}
            value={status}
            onChange={(e) => {
              void updateTicket(ticket.id, {
                status: e.target.value as TicketStatus,
              })
            }}
            options={[
              { value: 'open', label: t('common.open') }, { value: 'in_progress', label: t('common.inProgress') }, { value: 'waiting_on_student', label: t('common.waiting') }, { value: 'resolved', label: t('common.resolved') }, { value: 'closed', label: t('common.closed') },
            ]}
          />
          <Select
            id="agent-priority"
            label={t('tickets.priority')}
            value={priority}
            onChange={(e) => {
              void updateTicket(ticket.id, {
                priority: e.target.value as TicketPriority,
              })
            }}
            options={[
              { value: 'low', label: t('common.low') }, { value: 'medium', label: t('common.medium') }, { value: 'high', label: t('common.high') }, { value: 'urgent', label: t('common.urgent') },
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
            {t('agentDetail.resolve')}
          </Button>
        </div>
      </header>

      <div className={styles.grid}>
        <aside className={styles.meta} aria-label={t('tickets.details')}>
          <h2>{t('agentDetail.requester')}</h2>
          <dl>
            <div>
              <dt>{t('common.name')}</dt>
              <dd>{ticket.requesterName}</dd>
            </div>
            {ticket.requesterEmail ? (
              <div>
                <dt>{t('common.email')}</dt>
                <dd>
                  <small>{ticket.requesterEmail}</small>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>{t('tickets.department')}</dt>
              <dd>{ticket.category}</dd>
            </div>
            <div>
              <dt>{t('tickets.createdLabel')}</dt>
              <dd>{new Date(ticket.createdAt).toLocaleDateString(browserLocale(i18n.resolvedLanguage))}</dd>
            </div>
            <div>
              <dt>{t('agentDetail.assignee')}</dt>
              <dd>{assigneeLabel}</dd>
            </div>
            <div>
              <dt>SLA</dt>
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
              <h2>{t('agentDetail.details')}</h2>
              <p>{ticket.description}</p>
            </div>
          ) : null}
          <TicketAttachments
            ticketId={ticket.id}
            attachments={ticket.attachments}
            dropzoneId="agent-ticket-attachment"
          />
        </aside>

        <section className={styles.main} aria-label={t('tickets.conversation')}>
          <div
            className={styles.messages}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label={t('tickets.messages')}
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
                aria-label={`${item.authorName} said${item.internal ? ', internal note' : ''}`}
              >
                <p>{item.body}</p>
                <footer>
                  {item.authorName}
                  {item.internal ? ` · ${t('agentDetail.internal')}` : ''}
                </footer>
              </article>
            ))}
          </div>

          {showAi ? (
            <div className={styles.aiSuggest}>
              <p>
                {t('agentDetail.suggested')}
              </p>
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setReply(
                      'Your VPN certificate has expired. Please reinstall the VPN client from the IT portal.',
                    )
                    setShowAi(false)
                  }}
                >
                  {t('agentDetail.useReply')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAi(false)}
                >
                  {t('agentDetail.dismiss')}
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
              label={internalNote ? t('agentDetail.internalNote') : t('agentDetail.replyStudent')}
              rows={3}
              placeholder={
                internalNote
                  ? t('agentDetail.notePlaceholder')
                  : t('agentDetail.replyPlaceholder')
              }
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className={styles.composerActions}>
              <Toggle
                id="internal-note"
                label={t('agentDetail.internalNote')}
                checked={internalNote}
                onChange={setInternalNote}
              />
              <Button type="submit" disabled={mutating || !reply.trim()}>
                {internalNote ? t('agentDetail.addNote') : t('agentDetail.sendReply')}
              </Button>
            </div>
          </form>

          <div className={styles.resolve}>
            <Textarea
              id="resolution"
              label={t('agentDetail.resolution')}
              placeholder={t('agentDetail.resolutionPlaceholder')}
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
              {t('agentDetail.resolveNotify')}
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
