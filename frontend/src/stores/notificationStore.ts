import { create } from 'zustand'
import { isApiError, notificationsApi } from '@/lib/api'
import type { NotificationItem } from '@/types'

type IncomingNotification = Pick<
  NotificationItem,
  'title' | 'body' | 'ticketId'
> & {
  id?: string
}

interface NotificationState {
  items: NotificationItem[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  addIncoming: (payload: IncomingNotification) => NotificationItem
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  unreadCount: () => number
  clearError: () => void
  reset: () => void
}

const initialState = {
  items: [] as NotificationItem[],
  loading: false,
  error: null as string | null,
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...initialState,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const items = await notificationsApi.list()
      set({ items, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: isApiError(error)
          ? error.message
          : 'Failed to load notifications.',
      })
    }
  },

  addIncoming: (payload) => {
    const item: NotificationItem = {
      id: payload.id ?? `n-${Date.now()}`,
      title: payload.title,
      body: payload.body,
      ticketId: payload.ticketId,
      read: false,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      items: [item, ...state.items],
    }))

    return item
  },

  markRead: async (id) => {
    try {
      const updated = await notificationsApi.markRead(id)
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? updated : item,
        ),
      }))
    } catch (error) {
      set({
        error: isApiError(error)
          ? error.message
          : 'Failed to update notification.',
      })
    }
  },

  markAllRead: async () => {
    try {
      await notificationsApi.markAllRead()
      set((state) => ({
        items: state.items.map((item) => ({ ...item, read: true })),
      }))
    } catch (error) {
      set({
        error: isApiError(error)
          ? error.message
          : 'Failed to mark notifications read.',
      })
    }
  },

  unreadCount: () => get().items.filter((item) => !item.read).length,

  clearError: () => set({ error: null }),

  reset: () => set({ ...initialState }),
}))
