import { Button, DepartmentBadge, PriorityBadge } from '@/components/ui'
import { ticketDetailPath } from '@/app/routes'
import { Link } from 'react-router-dom'
import { useT, type MessageKey } from '@/lib/i18n'
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

function kindKey(kind: ProposedTicketAction['kind']): MessageKey {
  if (kind === 'create') return 'action.create'
  if (kind === 'update') return 'action.update'
  return 'action.comment'
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
  const t = useT()
  const busy = action.status === 'executing'
  const done = action.status === 'completed'
  const failed = action.status === 'failed'
  const cancelled = action.status === 'cancelled'
  const editing = action.status === 'editing'
  const title = t(kindKey(action.kind))

  const statusLabel = done
    ? t('action.done')
    : failed
      ? t('action.failed')
      : cancelled
        ? t('action.cancelled')
        : busy
          ? t('action.working')
          : editing
            ? t('action.editing')
            : t('action.review')

  return (
    <div
      className={compact ? `${styles.card} ${styles.compact}` : styles.card}
      role="group"
      aria-label={t('action.proposalAria', { kind: title })}
    >
      <header className={styles.head}>
        <h3>{title}</h3>
        <span className={styles.status}>{statusLabel}</span>
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
                <dt>{t('action.subject')}</dt>
                <dd>{action.create.subject}</dd>
              </div>
              <div>
                <dt>{t('table.department')}</dt>
                <dd>
                  <DepartmentBadge department={action.create.category} />
                </dd>
              </div>
              <div>
                <dt>{t('table.priority')}</dt>
                <dd>
                  <PriorityBadge priority={action.create.priority} />
                </dd>
              </div>
            </dl>
          ) : null}

          {action.kind === 'update' && action.update ? (
            <dl className={styles.summary}>
              <div>
                <dt>{t('action.ticket')}</dt>
                <dd>{action.update.ticketLabel}</dd>
              </div>
              {action.update.status ? (
                <div>
                  <dt>{t('table.status')}</dt>
                  <dd>
                    {t(
                      action.update.status === 'in_progress'
                        ? 'status.in_progress'
                        : action.update.status === 'waiting_on_student'
                          ? 'status.waiting_on_student'
                          : (`status.${action.update.status}` as MessageKey),
                    )}
                  </dd>
                </div>
              ) : null}
              {action.update.priority ? (
                <div>
                  <dt>{t('table.priority')}</dt>
                  <dd>
                    <PriorityBadge priority={action.update.priority} />
                  </dd>
                </div>
              ) : null}
              {action.update.category ? (
                <div>
                  <dt>{t('table.department')}</dt>
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
                <dt>{t('action.ticket')}</dt>
                <dd>{action.comment.ticketLabel}</dd>
              </div>
              <div>
                <dt>{t('action.commentLabel')}</dt>
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
                {t('action.openTicket')}
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
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={onBeginEdit}
              >
                {t('action.editDetails')}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={onConfirm}
              >
                {busy ? t('action.working') : title}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
