import { create } from 'zustand'
import {
  isApiError,
  ticketsApi,
  type AddCommentPayload,
  type CreateTicketPayload,
  type ListTicketsParams,
  type UpdateTicketPayload,
} from '@/lib/api'
import type { Ticket } from '@/types'

export type TicketListScope = 'mine' | 'queue'

interface TicketState {
  items: Ticket[]
  total: number
  page: number
  pageSize: number
  scope: TicketListScope
  filters: ListTicketsParams
  selected: Ticket | null
  loading: boolean
  detailLoading: boolean
  mutating: boolean
  error: string | null
  setScope: (scope: TicketListScope) => void
  setFilters: (filters: Partial<ListTicketsParams>) => void
  setPage: (page: number) => void
  fetchList: (overrides?: Partial<ListTicketsParams>) => Promise<void>
  fetchById: (ticketId: string) => Promise<Ticket | null>
  createTicket: (payload: CreateTicketPayload) => Promise<Ticket | null>
  updateTicket: (
    ticketId: string,
    payload: UpdateTicketPayload,
  ) => Promise<Ticket | null>
  addComment: (
    ticketId: string,
    payload: AddCommentPayload,
  ) => Promise<boolean>
  clearError: () => void
  reset: () => void
}

const defaultFilters: ListTicketsParams = {
  query: '',
  status: 'all',
  department: 'all',
  priority: 'all',
  assignee: 'all',
}

const initialState = {
  items: [] as Ticket[],
  total: 0,
  page: 1,
  pageSize: 6,
  scope: 'mine' as TicketListScope,
  filters: { ...defaultFilters },
  selected: null as Ticket | null,
  loading: false,
  detailLoading: false,
  mutating: false,
  error: null as string | null,
}

function errorMessage(error: unknown, fallback: string): string {
  return isApiError(error) ? error.message : fallback
}

function upsertTicket(items: Ticket[], ticket: Ticket): Ticket[] {
  const index = items.findIndex((item) => item.id === ticket.id)
  if (index === -1) return [ticket, ...items]
  const next = [...items]
  next[index] = ticket
  return next
}

export const useTicketStore = create<TicketState>((set, get) => ({
  ...initialState,

  setScope: (scope) => set({ scope }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      page: 1,
    })),

  setPage: (page) => set({ page: Math.max(1, page) }),

  fetchList: async (overrides = {}) => {
    const { scope, filters, page, pageSize } = get()
    const params: ListTicketsParams = {
      ...filters,
      ...overrides,
      page: overrides.page ?? page,
      pageSize: overrides.pageSize ?? pageSize,
      mine: scope === 'mine' ? true : overrides.mine,
    }

    set({ loading: true, error: null })
    try {
      const result =
        scope === 'mine'
          ? await ticketsApi.listMine(params)
          : await ticketsApi.list(params)
      set({
        items: result.items,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        loading: false,
      })
    } catch (error) {
      set({
        loading: false,
        error: errorMessage(error, 'Failed to load tickets.'),
      })
    }
  },

  fetchById: async (ticketId) => {
    set({ detailLoading: true, error: null })
    try {
      const ticket = await ticketsApi.getById(ticketId)
      set((state) => ({
        selected: ticket,
        items: upsertTicket(state.items, ticket),
        detailLoading: false,
      }))
      return ticket
    } catch (error) {
      set({
        selected: null,
        detailLoading: false,
        error: errorMessage(error, 'Failed to load ticket.'),
      })
      return null
    }
  },

  createTicket: async (payload) => {
    set({ mutating: true, error: null })
    try {
      const ticket = await ticketsApi.create(payload)
      set((state) => ({
        items: [ticket, ...state.items],
        total: state.total + 1,
        selected: ticket,
        mutating: false,
      }))
      return ticket
    } catch (error) {
      set({
        mutating: false,
        error: errorMessage(error, 'Failed to create ticket.'),
      })
      return null
    }
  },

  updateTicket: async (ticketId, payload) => {
    set({ mutating: true, error: null })
    try {
      const ticket = await ticketsApi.update(ticketId, payload)
      set((state) => {
        const previous =
          state.selected?.id === ticket.id ? state.selected : null
        const merged = previous
          ? {
              ...ticket,
              // PATCH responses omit comments / display names — keep local ones.
              comments: ticket.comments.length
                ? ticket.comments
                : previous.comments,
              requesterName: ticket.requesterName ?? previous.requesterName,
              requesterEmail: ticket.requesterEmail ?? previous.requesterEmail,
              assignedName:
                ticket.assignedName ??
                (ticket.assignedTo === previous.assignedTo
                  ? previous.assignedName
                  : ticket.assignedName),
              attachments: ticket.attachments ?? previous.attachments,
              slaHoursRemaining:
                ticket.slaHoursRemaining ?? previous.slaHoursRemaining,
            }
          : ticket
        return {
          items: upsertTicket(state.items, merged),
          selected: previous ? merged : state.selected,
          mutating: false,
        }
      })
      return ticket
    } catch (error) {
      set({
        mutating: false,
        error: errorMessage(error, 'Failed to update ticket.'),
      })
      return null
    }
  },

  addComment: async (ticketId, payload) => {
    set({ mutating: true, error: null })
    try {
      const comment = await ticketsApi.addComment(ticketId, payload)
      set((state) => {
        const selected =
          state.selected?.id === ticketId
            ? {
                ...state.selected,
                comments: [...state.selected.comments, comment],
                updatedAt: comment.createdAt,
              }
            : state.selected

        const items = state.items.map((item) =>
          item.id === ticketId && selected ? selected : item,
        )

        return { selected, items, mutating: false }
      })
      return true
    } catch (error) {
      set({
        mutating: false,
        error: errorMessage(error, 'Failed to post comment.'),
      })
      return false
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ ...initialState, filters: { ...defaultFilters } }),
}))
