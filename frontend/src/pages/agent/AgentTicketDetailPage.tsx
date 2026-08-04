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
  StatusBadge,
  Textarea,
  Toggle,
} from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'
import { listAssignableStaff } from '@/mocks/data'
import { useAuthStore, useTicketStore, useUiStore } from '@/stores'
import type { Department, TicketPriority, TicketStatus } from '@/types'
import styles from './AgentTicketDetailPage.module.css'

const DEPARTMENTS: Department[] = [
  'Academics',
  'IT',
  'Finance',
  'Maintenance',
]

export function AgentTicketDetailPage() {
  const { ticketId } = useParams()
  const user = useAuthStore((s) => s.user)
  const ticket = useTicketStore((s) => s.selected)
  const loading = useTicketStore((s) => s.detailLoading)
  const mutating = useTicketStore((s) => s.mutating)
  const error = useTicketStore((s) => s.error)
  const fetchById = useTicketStore((s) => s.fetchById)
  const updateTicket = useTicketStore((s) => s.updateTicket)
  const addComment = useTicketStore((s) => s.addComment)
  const pushToast = useUiStore((s) => s.pushToast)

  const [reply, setReply] = useState('')
  const [resolution, setResolution] = useState('')
  const [internalNote, setInternalNote] = useState(false)
  const [showAi, setShowAi] = useState(true)
  const [assigneeId, setAssigneeId] = useState('')
  const [escalateDept, setEscalateDept] = useState<Department>('IT')
  const [escalateAssignee, setEscalateAssignee] = useState('')
  const [loadedTicketId, setLoadedTicketId] = useState<string | null>(null)

  usePageTitle(ticket ? `${ticket.id}: ${ticket.subject}` : 'Ticket Detail')

  useEffect(() => {
    if (ticketId) void fetchById(ticketId)
  }, [ticketId, fetchById])

  if (ticket && loadedTicketId !== ticket.id) {
    setLoadedTicketId(ticket.id)
    setAssigneeId(ticket.assignedTo ?? '')
    setEscalateDept(ticket.category)
    setEscalateAssignee('')
  }

  const staffOptions = listAssignableStaff()
  const escalateStaff = listAssignableStaff(escalateDept)

  if (loading && !ticket) {
    return (
      <p className={styles.missing} aria-live="polite">
        Loading ticket…
      </p>
    )
  }

  if (!ticket) {
    return (
      <div className={styles.missing}>
        <h1>Ticket not found</h1>
        {error ? <p role="alert">{error}</p> : null}
        <ButtonLink to={ROUTES.queue}>Back to queue</ButtonLink>
      </div>
    )
  }

  const status = ticket.status
  const priority = ticket.priority
  const isAssigned = Boolean(ticket.assignedTo)
  const assignedToMe = ticket.assignedTo === user?.id

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

  async function assignToMe() {
    if (!user || !ticket) return
    const updated = await updateTicket(ticket.id, {
      assignedTo: user.id,
      assignedName: user.displayName,
      status: ticket.status === 'open' ? 'in_progress' : ticket.status,
    })
    if (updated) {
      setAssigneeId(user.id)
      pushToast({
        title: 'Ticket assigned',
        body: `Assigned to ${user.displayName}.`,
        tone: 'success',
      })
    }
  }

  async function applyAssignee() {
    if (!ticket) return
    if (!assigneeId) {
      const updated = await updateTicket(ticket.id, { assignedTo: null })
      if (updated) {
        pushToast({
          title: 'Ticket unassigned',
          body: 'No agent is assigned to this ticket.',
          tone: 'success',
        })
      }
      return
    }
    const staff = staffOptions.find((s) => s.id === assigneeId)
    const updated = await updateTicket(ticket.id, {
      assignedTo: assigneeId,
      assignedName: staff?.name,
      status: ticket.status === 'open' ? 'in_progress' : ticket.status,
    })
    if (updated) {
      pushToast({
        title: isAssigned ? 'Ticket reassigned' : 'Ticket assigned',
        body: `Now assigned to ${staff?.name ?? 'selected staff'}.`,
        tone: 'success',
      })
    }
  }

  async function escalateTicket() {
    if (!ticket) return
    const updated = await updateTicket(ticket.id, {
      category: escalateDept,
      assignedTo: escalateAssignee || null,
      assignedName: escalateAssignee
        ? escalateStaff.find((s) => s.id === escalateAssignee)?.name
        : null,
    })
    if (updated) {
      setEscalateDept(escalateDept)
      setAssigneeId(escalateAssignee)
      pushToast({
        title: 'Ticket escalated',
        body: escalateAssignee
          ? `Moved to ${escalateDept} and assigned.`
          : `Moved to ${escalateDept} queue (unassigned).`,
        tone: 'success',
      })
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link to={ROUTES.queue} className={styles.back}>
            ← Back to queue
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
            label="Status"
            value={status}
            onChange={(e) => {
              void updateTicket(ticket.id, {
                status: e.target.value as TicketStatus,
              })
            }}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'waiting_on_student', label: 'Waiting' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
          <Select
            id="agent-priority"
            label="Priority"
            value={priority}
            onChange={(e) => {
              void updateTicket(ticket.id, {
                priority: e.target.value as TicketPriority,
              })
            }}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
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
            Resolve
          </Button>
        </div>
      </header>

      <div className={styles.grid}>
        <aside className={styles.meta} aria-label="Ticket details">
          <h2>Requester</h2>
          <dl>
            <div>
              <dt>Name</dt>
              <dd>{ticket.requesterName}</dd>
            </div>
            {ticket.requesterEmail ? (
              <div>
                <dt>Email</dt>
                <dd>
                  <small>{ticket.requesterEmail}</small>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Department</dt>
              <dd>{ticket.category}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(ticket.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Assignee</dt>
              <dd>{ticket.assignedName ?? 'Unassigned'}</dd>
            </div>
            <div>
              <dt>SLA</dt>
              <dd>
                {ticket.slaHoursRemaining != null
                  ? `${ticket.slaHoursRemaining}h remaining`
                  : '—'}
              </dd>
            </div>
          </dl>

          <div className={styles.assignPanel}>
            <h2>Assign & escalate</h2>
            <p className={styles.assignHint}>
              Claim the ticket yourself, hand it to a teammate, or escalate to
              another department.
            </p>

            <div className={styles.assignActions}>
              <Button
                size="sm"
                variant="secondary"
                disabled={mutating || assignedToMe}
                onClick={() => void assignToMe()}
              >
                {assignedToMe ? 'Assigned to you' : 'Assign to me'}
              </Button>
            </div>

            <Select
              id="assign-staff"
              label={isAssigned ? 'Reassign to' : 'Assign to'}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...staffOptions.map((s) => ({
                  value: s.id,
                  label: `${s.name} · ${s.department}`,
                })),
              ]}
            />
            <Button
              size="sm"
              disabled={
                mutating || (assigneeId || '') === (ticket.assignedTo ?? '')
              }
              onClick={() => void applyAssignee()}
            >
              {isAssigned ? 'Save reassignment' : 'Assign ticket'}
            </Button>

            <div className={styles.escalateBlock}>
              <h3>Escalate</h3>
              <Select
                id="escalate-dept"
                label="Department"
                value={escalateDept}
                onChange={(e) => {
                  setEscalateDept(e.target.value as Department)
                  setEscalateAssignee('')
                }}
                options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
              />
              <Select
                id="escalate-staff"
                label="Assignee in new department"
                value={escalateAssignee}
                onChange={(e) => setEscalateAssignee(e.target.value)}
                options={[
                  { value: '', label: 'Leave unassigned' },
                  ...escalateStaff.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  mutating ||
                  (escalateDept === ticket.category &&
                    (escalateAssignee || '') === (ticket.assignedTo ?? ''))
                }
                onClick={() => void escalateTicket()}
              >
                Escalate ticket
              </Button>
            </div>
          </div>

          {ticket.description ? (
            <div className={styles.description}>
              <h2>Details</h2>
              <p>{ticket.description}</p>
            </div>
          ) : null}
          {ticket.attachments?.length ? (
            <div className={styles.attachments}>
              <h2>Attachments</h2>
              <ul>
                {ticket.attachments.map((file) => (
                  <li key={file.id}>{file.name}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>

        <section className={styles.main} aria-label="Conversation">
          <div
            className={styles.messages}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Ticket messages"
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
                  {item.internal ? ' · Internal' : ''}
                </footer>
              </article>
            ))}
          </div>

          {showAi ? (
            <div className={styles.aiSuggest}>
              <p>
                Suggested reply: Your VPN certificate has expired. Please
                reinstall the VPN client from the IT portal.
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
                  Use this reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAi(false)}
                >
                  Dismiss
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
              label={internalNote ? 'Internal note' : 'Reply to student'}
              rows={3}
              placeholder={
                internalNote
                  ? 'Write a note visible to staff only...'
                  : 'Write a reply to the student...'
              }
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className={styles.composerActions}>
              <Toggle
                id="internal-note"
                label="Internal note"
                checked={internalNote}
                onChange={setInternalNote}
              />
              <Button type="submit" disabled={mutating || !reply.trim()}>
                {internalNote ? 'Add note' : 'Send reply'}
              </Button>
            </div>
          </form>

          <div className={styles.resolve}>
            <Textarea
              id="resolution"
              label="Resolution summary"
              placeholder="Summarize how this was resolved..."
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
              Resolve & notify student
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
