import { mockNotifications } from '@/mocks/data'
import type { NotificationItem } from '@/types'
import { mockLatency, usesMockNotifications } from './client'
import { ApiError } from './errors'

/**
 * Notifications are not a backend slice yet. Hybrid/mock keep the fixture
 * inbox so the shell looks complete; pure api mode reports empty.
 */
export const notificationsApi = {
  async list(): Promise<NotificationItem[]> {
    if (usesMockNotifications()) {
      await mockLatency(180)
      return structuredClone(mockNotifications)
    }
    return []
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
    throw new ApiError('Notification not found.', {
      code: 'NOT_FOUND',
      status: 404,
    })
  },

  async markAllRead(): Promise<void> {
    if (usesMockNotifications()) {
      await mockLatency(100)
      mockNotifications.forEach((n) => {
        n.read = true
      })
      return
    }
    // Nothing to mark while the inbox is always empty.
  },
}
