import { beforeEach, describe, expect, it } from 'vitest'
import { useNotificationStore } from './notificationStore'
import { resetClientState } from './resetClientState'
import { useTicketStore } from './ticketStore'

describe('ticketStore', () => {
  beforeEach(() => {
    useTicketStore.getState().reset()
  })

  it('fetches mine tickets into state', async () => {
    useTicketStore.getState().setScope('mine')
    await useTicketStore.getState().fetchList({ pageSize: 20 })

    const state = useTicketStore.getState()
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.items.length).toBeGreaterThan(0)
    expect(state.items.every((t) => t.createdBy === 'user-1')).toBe(true)
  })

  it('loads a ticket by id into selected', async () => {
    const ticket = await useTicketStore.getState().fetchById('TCK-1042')
    expect(ticket?.id).toBe('TCK-1042')
    expect(useTicketStore.getState().selected?.subject).toContain('exam')
  })

  it('creates a ticket and prepends it to items', async () => {
    const created = await useTicketStore.getState().createTicket({
      subject: 'Store test ticket',
      description: 'Created from unit test',
      category: 'IT',
      priority: 'low',
    })
    expect(created?.subject).toBe('Store test ticket')
    expect(useTicketStore.getState().items[0]?.id).toBe(created?.id)
  })
})

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.getState().reset()
  })

  it('fetches notifications and tracks unread count', async () => {
    await useNotificationStore.getState().fetchAll()
    const state = useNotificationStore.getState()
    expect(state.items.length).toBeGreaterThan(0)
    expect(state.unreadCount()).toBeGreaterThan(0)
  })

  it('marks a notification as read', async () => {
    await useNotificationStore.getState().fetchAll()
    const first = useNotificationStore.getState().items.find((n) => !n.read)
    expect(first).toBeTruthy()
    await useNotificationStore.getState().markRead(first!.id)
    expect(
      useNotificationStore.getState().items.find((n) => n.id === first!.id)
        ?.read,
    ).toBe(true)
  })

  it('prepends incoming notifications', () => {
    const before = useNotificationStore.getState().items.length
    const item = useNotificationStore.getState().addIncoming({
      title: 'New reply',
      body: 'An agent replied to your ticket',
      ticketId: 'TCK-2000',
    })
    const state = useNotificationStore.getState()
    expect(state.items.length).toBe(before + 1)
    expect(state.items[0]?.id).toBe(item.id)
    expect(state.items[0]?.read).toBe(false)
  })
})

describe('resetClientState', () => {
  it('clears ticket and notification caches', async () => {
    await useTicketStore.getState().fetchList()
    await useNotificationStore.getState().fetchAll()
    resetClientState()
    expect(useTicketStore.getState().items).toEqual([])
    expect(useNotificationStore.getState().items).toEqual([])
  })
})
