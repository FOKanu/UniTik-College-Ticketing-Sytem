import { Button, DepartmentBadge, PriorityBadge } from '@/components/ui'
import { ticketDetailPath } from '@/app/routes'
import { Link } from 'react-router-dom'
import type { ProposedTicketAction } from './ticketActionTypes'
import { TicketActionEditForm } from './TicketActionEditForm'
import styles from './TicketActionCard.module.css'

interface TicketActionCardProps {
  action: ProposedTicketAction
  compact?: boolean
  onConfirm: () => void
  onCancel: () => void
  onBeginEdit: () => void
  onSaveEdit: (next: ProposedTicketAction) => void
  onCancelEdit: () => void
}

function kindTitle(kind: ProposedTicketAction['kind']): string {
  if (kind === 'create') return 'Create ticket'
  if (kind === 'update') return 'Update ticket'
  return 'Add comment'
}

function confirmLabel(kind: ProposedTicketAction['kind']): string {
  if (kind === 'create') return 'Create ticket'
  if (kind === 'update') return 'Update ticket'
  return 'Add comment'
}

export function TicketActionCard({
  action,
  compact = false,
  onConfirm,
  onCancel,
  onBeginEdit,
  onSaveEdit,
  onCancelEdit,
}: TicketActionCardProps) {
  const busy = action.status === 'executing'
  const done = action.status === 'completed'
  const failed = action.status === 'failed'
  const cancelled = action.status === 'cancelled'
  const editing = action.status === 'editing'

  return (
    <div
      className={compact ? `${styles.card} ${styles.compact}` : styles.card}
      role="group"
      aria-label={`${kindTitle(action.kind)} proposal`}
    >
      <header className={styles.head}>
        <h3>{kindTitle(action.kind)}</h3>
        <span className={styles.status}>
          {done
            ? 'Done'
            : failed
              ? 'Failed'
              : cancelled
                ? 'Cancelled'
                : busy
                  ? 'Working…'
                  : editing
                    ? 'Editing'
                    : 'Review'}
        </span>
      </header>

      {editing ? (
        <TicketActionEditForm
          action={action}
          compact={compact}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          {action.kind === 'create' && action.create ? (
            <dl className={styles.summary}>
              <div>
                <dt>Subject</dt>
                <dd>{action.create.subject}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>
                  <DepartmentBadge department={action.create.category} />
                </dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>
                  <PriorityBadge priority={action.create.priority} />
                </dd>
              </div>
            </dl>
          ) : null}

          {action.kind === 'update' && action.update ? (
            <dl className={styles.summary}>
              <div>
                <dt>Ticket</dt>
                <dd>{action.update.ticketLabel}</dd>
              </div>
              {action.update.status ? (
                <div>
                  <dt>Status</dt>
                  <dd>{action.update.status.replace('_', ' ')}</dd>
                </div>
              ) : null}
              {action.update.priority ? (
                <div>
                  <dt>Priority</dt>
                  <dd>
                    <PriorityBadge priority={action.update.priority} />
                  </dd>
                </div>
              ) : null}
              {action.update.category ? (
                <div>
                  <dt>Department</dt>
                  <dd>
                    <DepartmentBadge department={action.update.category} />
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {action.kind === 'comment' && action.comment ? (
            <dl className={styles.summary}>
              <div>
                <dt>Ticket</dt>
                <dd>{action.comment.ticketLabel}</dd>
              </div>
              <div>
                <dt>Comment</dt>
                <dd className={styles.commentBody}>{action.comment.body}</dd>
              </div>
            </dl>
          ) : null}

          {failed && action.error ? (
            <p className={styles.error} role="alert">
              {action.error}
            </p>
          ) : null}

          {done && action.resultTicketId ? (
            <p className={styles.done}>
              <Link to={ticketDetailPath(action.resultTicketId)}>
                Open ticket
                {action.resultSubject ? `: ${action.resultSubject}` : ''}
              </Link>
            </p>
          ) : null}

          {!done && !cancelled ? (
            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={onBeginEdit}
              >
                Edit details
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={onConfirm}
              >
                {busy ? 'Working…' : confirmLabel(action.kind)}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
