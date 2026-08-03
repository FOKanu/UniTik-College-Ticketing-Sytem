import { mockNotifications } from '@/mocks/data'
import type { NotificationItem } from '@/types'
import { type Envelope, unwrap } from './adapters'
import {
  get,
  mockLatency,
  patch,
  post,
  usesMockNotifications,
} from './client'
import { ApiError } from './errors'

interface BackendNotification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
  ticketId?: string | null
}

function toItem(raw: BackendNotification): NotificationItem {
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body,
    read: raw.read,
    createdAt: raw.createdAt,
    ticketId: raw.ticketId ?? undefined,
  }
}

export const notificationsApi = {
  async list(): Promise<NotificationItem[]> {
    if (usesMockNotifications()) {
      await mockLatency(180)
      return structuredClone(mockNotifications)
    }

    const raw = unwrap(
      await get<Envelope<BackendNotification[]>>('/notifications'),
    )
    return raw.map(toItem)
  },

  async markRead(id: string): Promise<NotificationItem> {
    if (usesMockNotifications()) {
      await mockLatency(100)
      const item = mockNotifications.find((n) => n.id === id)
      if (!item) {
        throw new ApiError('Notification not found.', {
          code: 'NOT_FOUND',
          status: 404,
        })
      }
      item.read = true
      return structuredClone(item)
    }

    const updated = unwrap(
      await patch<Envelope<BackendNotification>>(
        `/notifications/${id}/read`,
      ),
    )
    return toItem(updated)
  },

  async markAllRead(): Promise<void> {
    if (usesMockNotifications()) {
      await mockLatency(100)
      mockNotifications.forEach((n) => {
        n.read = true
      })
      return
    }

    unwrap(
      await post<Envelope<{ updated: number }>>(
        '/notifications/mark-all-read',
      ),
    )
  },
}
