import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { Button } from '@/components/ui'
import { usePermissions } from '@/hooks/useAuth'
import { useDialogFocus } from '@/hooks/useDialogFocus'
import {
  formatNotificationTime,
  notificationTicketPath,
} from '@/lib/notifications'
import { useNotificationStore } from '@/stores'
import type { NotificationItem } from '@/types'
import styles from './NotificationCenter.module.css'

const PREVIEW_LIMIT = 6

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 3a5 5 0 0 0-5 5v2.1c0 .5-.2 1-.5 1.4L5.1 14h13.8l-1.4-2.5a2 2 0 0 1-.5-1.4V8a5 5 0 0 0-5-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 17a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function NotificationCenter() {
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const { role } = usePermissions()
  const [open, setOpen] = useState(false)
  const closePanel = useCallback(() => setOpen(false), [])

  const items = useNotificationStore((s) => s.items)
  const loading = useNotificationStore((s) => s.loading)
  const fetchAll = useNotificationStore((s) => s.fetchAll)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const unread = useNotificationStore((s) => s.unreadCount())

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  useDialogFocus({
    open,
    containerRef: panelRef,
    triggerRef,
    onClose: closePanel,
  })

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  const preview = items.slice(0, PREVIEW_LIMIT)

  async function handleSelect(item: NotificationItem) {
    if (!item.read) {
      await markRead(item.id)
    }
    setOpen(false)
    if (item.ticketId) {
      void navigate(notificationTicketPath(role, item.ticketId))
    }
  }

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={
          unread > 0
            ? `Notifications, ${unread} unread`
            : 'Notifications'
        }
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon />
        {unread > 0 ? (
          <span className={styles.badge} aria-hidden>
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label="Notification history"
        >
          <header className={styles.header}>
            <div>
              <h2>Notifications</h2>
              {unread > 0 ? (
                <p>{unread} unread</p>
              ) : (
                <p>You're all caught up</p>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={loading || unread === 0}
              onClick={() => void markAllRead()}
            >
              Mark all read
            </Button>
          </header>

          <div className={styles.listWrap}>
            {loading && items.length === 0 ? (
              <p className={styles.empty}>Loading…</p>
            ) : preview.length === 0 ? (
              <p className={styles.empty}>No notifications yet.</p>
            ) : (
              <ul className={styles.list}>
                {preview.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={
                        item.read ? styles.itemRead : styles.itemUnread
                      }
                      onClick={() => void handleSelect(item)}
                    >
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemBody}>{item.body}</span>
                      <time dateTime={item.createdAt}>
                        {formatNotificationTime(item.createdAt)}
                      </time>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className={styles.footer}>
            <Link
              to={ROUTES.notifications}
              className={styles.viewAll}
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </footer>
        </div>
      ) : null}
    </div>
  )
}
