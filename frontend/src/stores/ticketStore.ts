import { create } from 'zustand'
import {
  isApiError,
  ticketsApi,
  type AddCommentPayload,
  type CreateTicketPayload,
  type ListTicketsParams,
  type UpdateTicketPayload,
} from '@/lib/api'
import type { Ticket, TicketAttachment } from '@/types'

export type TicketListScope = 'mine' | 'queue'

/**
 * Outcome of a bulk action. There is no bulk endpoint, so each ticket is
 * PATCHed independently and some may fail while others succeed — the caller
 * has to surface partial failure honestly.
 */
export interface BulkResult {
  succeeded: string[]
  failed: { id: string; message: string }[]
}

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
  createTicket: (
    payload: CreateTicketPayload,
    file?: File | null,
  ) => Promise<Ticket | null>
  updateTicket: (
    ticketId: string,
    payload: UpdateTicketPayload,
  ) => Promise<Ticket | null>
  addComment: (ticketId: string, payload: AddCommentPayload) => Promise<boolean>
  uploadAttachment: (
    ticketId: string,
    file: File,
  ) => Promise<TicketAttachment | null>
  deleteAttachment: (ticketId: string, attachmentId: string) => Promise<boolean>
  bulkUpdate: (
    ticketIds: string[],
    payload: UpdateTicketPayload,
  ) => Promise<BulkResult>
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

  createTicket: async (payload, file = null) => {
    set({ mutating: true, error: null })
    try {
      let ticket = await ticketsApi.create(payload)
      if (file) {
        try {
          const attachment = await ticketsApi.uploadAttachment(ticket.id, file)
          ticket = {
            ...ticket,
            attachments: [...(ticket.attachments ?? []), attachment],
          }
        } catch (error) {
          // Ticket already exists — keep it and surface the upload failure.
          set({
            items: [ticket, ...get().items],
            total: get().total + 1,
            selected: ticket,
            mutating: false,
            error: errorMessage(
              error,
              'Ticket created, but the attachment failed to upload.',
            ),
          })
          return ticket
        }
      }
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

  uploadAttachment: async (ticketId, file) => {
    set({ mutating: true, error: null })
    try {
      const attachment = await ticketsApi.uploadAttachment(ticketId, file)
      set((state) => {
        const patchAttachments = (ticket: Ticket): Ticket => ({
          ...ticket,
          attachments: [...(ticket.attachments ?? []), attachment],
        })
        return {
          selected:
            state.selected?.id === ticketId
              ? patchAttachments(state.selected)
              : state.selected,
          items: state.items.map((item) =>
            item.id === ticketId ? patchAttachments(item) : item,
          ),
          mutating: false,
        }
      })
      return attachment
    } catch (error) {
      set({
        mutating: false,
        error: errorMessage(error, 'Failed to upload attachment.'),
      })
      return null
    }
  },

  deleteAttachment: async (ticketId, attachmentId) => {
    set({ mutating: true, error: null })
    try {
      await ticketsApi.deleteAttachment(ticketId, attachmentId)
      set((state) => {
        const removeAttachment = (ticket: Ticket): Ticket => ({
          ...ticket,
          attachments: (ticket.attachments ?? []).filter(
            (item) => item.id !== attachmentId,
          ),
        })
        return {
          selected:
            state.selected?.id === ticketId
              ? removeAttachment(state.selected)
              : state.selected,
          items: state.items.map((item) =>
            item.id === ticketId ? removeAttachment(item) : item,
          ),
          mutating: false,
        }
      })
      return true
    } catch (error) {
      set({
        mutating: false,
        error: errorMessage(error, 'Failed to remove attachment.'),
      })
      return false
    }
  },

  /**
   * Applies the same patch to several tickets. The API has no bulk route, so
   * this fans out one PATCH per ticket and reports per-ticket outcomes rather
   * than failing the whole batch on the first rejection.
   */
  bulkUpdate: async (ticketIds, payload) => {
    if (ticketIds.length === 0) return { succeeded: [], failed: [] }

    set({ mutating: true, error: null })
    const outcomes = await Promise.all(
      ticketIds.map(async (id) => {
        try {
          const ticket = await ticketsApi.update(id, payload)
          return { id, ticket, message: null as string | null }
        } catch (error) {
          return {
            id,
            ticket: null,
            message: errorMessage(error, 'Update failed.'),
          }
        }
      }),
    )

    const result: BulkResult = { succeeded: [], failed: [] }
    const updated: Ticket[] = []
    for (const outcome of outcomes) {
      if (outcome.ticket) {
        result.succeeded.push(outcome.id)
        updated.push(outcome.ticket)
      } else {
        result.failed.push({ id: outcome.id, message: outcome.message! })
      }
    }

    set((state) => ({
      items: updated.reduce(upsertTicket, state.items),
      mutating: false,
      error:
        result.failed.length > 0
          ? `${result.failed.length} of ${ticketIds.length} tickets could not be updated.`
          : null,
    }))

    return result
  },

  clearError: () => set({ error: null }),

  reset: () => set({ ...initialState, filters: { ...defaultFilters } }),
}))
