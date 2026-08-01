import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ticketDetailPath } from '@/app/routes'
import { Button } from '@/components/ui'
import { usePermissions } from '@/hooks/useAuth'
import {
  formatNotificationTime,
  notificationTicketPath,
} from '@/lib/notifications'
import { useNotificationStore } from '@/stores'
import styles from './NotificationsPage.module.css'

export function NotificationsPage() {
  const { role } = usePermissions()
  const items = useNotificationStore((s) => s.items)
  const loading = useNotificationStore((s) => s.loading)
  const error = useNotificationStore((s) => s.error)
  const fetchAll = useNotificationStore((s) => s.fetchAll)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Notifications</h1>
          <p>Updates about your tickets and conversations.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void markAllRead()}
          disabled={loading || items.every((i) => i.read)}
        >
          Mark all read
        </Button>
      </header>

      {loading ? (
        <p aria-live="polite">Loading notifications…</p>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={item.read ? styles.read : styles.unread}>
            <div>
              <strong>
                {item.title}
                {!item.read ? (
                  <span className="sr-only"> (unread)</span>
                ) : null}
              </strong>
              <p>{item.body}</p>
              <time dateTime={item.createdAt}>
                {formatNotificationTime(item.createdAt)}
              </time>
            </div>
            <div className={styles.actions}>
              {!item.read ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void markRead(item.id)}
                >
                  Mark read
                </Button>
              ) : null}
              {item.ticketId ? (
                <Link
                  to={
                    role === 'student'
                      ? ticketDetailPath(item.ticketId)
                      : notificationTicketPath(role, item.ticketId)
                  }
                >
                  View
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
