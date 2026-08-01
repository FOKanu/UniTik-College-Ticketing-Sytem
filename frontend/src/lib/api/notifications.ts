import { mockNotifications } from '@/mocks/data'
import type { NotificationItem } from '@/types'
import { get, isMockDataSource, mockLatency, patch } from './client'
import { ApiError } from './errors'

export const notificationsApi = {
  async list(): Promise<NotificationItem[]> {
    if (isMockDataSource()) {
      await mockLatency(180)
      return structuredClone(mockNotifications)
    }
    return get<NotificationItem[]>('/notifications')
  },

  async markRead(id: string): Promise<NotificationItem> {
    if (isMockDataSource()) {
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
    return patch<NotificationItem>(`/notifications/${id}`, { read: true })
  },

  async markAllRead(): Promise<void> {
    if (isMockDataSource()) {
      await mockLatency(100)
      mockNotifications.forEach((n) => {
        n.read = true
      })
      return
    }
    await patch('/notifications/read-all', {})
  },
}
