import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import {
  Button,
  ButtonLink,
  DepartmentBadge,
  PriorityBadge,
  StatusBadge,
  Textarea,
} from '@/components/ui'
import { TicketAttachments } from '@/components/tickets/TicketAttachments'
import { IconChevronLeft, IconSend } from '@/components/ui/icons'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useTicketStore } from '@/stores'
import styles from './TicketDetailPage.module.css'

const STEPS = ['Submitted', 'In Progress', 'Resolved'] as const

function stepIndex(status: string): number {
  if (status === 'resolved' || status === 'closed') return 2
  if (status === 'in_progress' || status === 'waiting_on_student') return 1
  return 0
}

export function TicketDetailPage() {
  const { ticketId } = useParams()
  const ticket = useTicketStore((s) => s.selected)
  const loading = useTicketStore((s) => s.detailLoading)
  const mutating = useTicketStore((s) => s.mutating)
  const error = useTicketStore((s) => s.error)
  const fetchById = useTicketStore((s) => s.fetchById)
  const addComment = useTicketStore((s) => s.addComment)
  const [comment, setComment] = useState('')

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
        <ButtonLink to={ROUTES.tickets}>Back to My Tickets</ButtonLink>
      </div>
    )
  }

  const activeStep = stepIndex(ticket.status)

  async function handleComment(event: FormEvent) {
    event.preventDefault()
    if (!comment.trim() || !ticket) return
    const ok = await addComment(ticket.id, { body: comment.trim() })
    if (ok) setComment('')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to={ROUTES.tickets} className={styles.back}>
          <IconChevronLeft width={16} height={16} />
          Back to My Tickets
        </Link>
        <p className={styles.ticketId}>{ticket.id}</p>
        <h1>{ticket.subject}</h1>
        <div className={styles.badges}>
          <DepartmentBadge department={ticket.category} />
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.info} aria-label="Ticket details">
          <ol className={styles.timeline} aria-label="Ticket progress">
            {STEPS.map((label, index) => (
              <li
                key={label}
                className={index <= activeStep ? styles.done : undefined}
                aria-current={index === activeStep ? 'step' : undefined}
              >
                <span />
                {label}
              </li>
            ))}
          </ol>

          <dl className={styles.meta}>
            <div>
              <dt>Department</dt>
              <dd>{ticket.category}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{ticket.priority}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(ticket.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Assigned to</dt>
              <dd>{ticket.assignedName ?? 'Unassigned'}</dd>
            </div>
          </dl>

          <TicketAttachments
            ticketId={ticket.id}
            attachments={ticket.attachments}
            dropzoneId="student-ticket-attachment"
          />
        </section>

        <section className={styles.chat} aria-label="Conversation">
          <div
            className={styles.messages}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Ticket messages"
          >
            {ticket.comments.map((item) => {
              const mine = item.authorName === 'You'
              return (
                <article
                  key={item.id}
                  className={mine ? styles.mine : styles.theirs}
                  aria-label={`${mine ? 'You' : item.authorName} said`}
                >
                  <p>{item.body}</p>
                  <footer>{item.authorName}</footer>
                </article>
              )
            })}
          </div>
          <form
            className={styles.composer}
            onSubmit={(e) => void handleComment(e)}
          >
            <Textarea
              id="reply"
              label="Reply"
              rows={2}
              placeholder="Write a reply..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button type="submit" disabled={mutating}>
              <IconSend width={16} height={16} />
              Send
            </Button>
          </form>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
        </section>
      </div>
    </div>
  )
}
