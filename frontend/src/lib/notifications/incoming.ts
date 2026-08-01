import { useNotificationStore } from '@/stores/notificationStore'
import { useUiStore } from '@/stores/uiStore'
import type { NotificationItem } from '@/types'

type IncomingNotification = Pick<
  NotificationItem,
  'title' | 'body' | 'ticketId'
> & {
  id?: string
}

/** Push a notification into history and surface a toast (WebSocket-ready). */
export function presentIncomingNotification(
  payload: IncomingNotification,
): NotificationItem {
  const item = useNotificationStore.getState().addIncoming(payload)

  useUiStore.getState().pushToast({
    id: `toast-${item.id}`,
    title: item.title,
    body: item.body,
    tone: 'info',
  })

  return item
}
