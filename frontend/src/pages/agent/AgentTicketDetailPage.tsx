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
import { useTicketStore } from '@/stores'
import type { TicketPriority, TicketStatus } from '@/types'
import styles from './AgentTicketDetailPage.module.css'

export function AgentTicketDetailPage() {
  const { ticketId } = useParams()
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

  usePageTitle(ticket ? `${ticket.id}: ${ticket.subject}` : 'Ticket Detail')

  useEffect(() => {
    if (ticketId) void fetchById(ticketId)
  }, [ticketId, fetchById])

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
