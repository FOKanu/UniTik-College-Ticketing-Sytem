import { useCallback, useEffect, useRef, useState } from 'react'
import {
  chatApi,
  ticketsApi,
  usesLiveChat,
  type ChatMode,
  type Citation,
  type EscalatedTicket,
  type LlmHealth,
} from '@/lib/api'
import {
  isTicketCreateIntent,
  withCreateProposalMessage,
  type ProposedTicketAction,
  type TicketCommentDraft,
  type TicketUpdateDraft,
} from '@/components/chat/ticketActionTypes'

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  body: string
  streaming?: boolean
  /** KB articles the answer was grounded in (live chat only). */
  citations?: Citation[]
  /** True when no KB article matched strongly — treat the answer with care. */
  retrievalWeak?: boolean
  /** Proposed ticket create/update/comment awaiting user confirmation. */
  action?: ProposedTicketAction
}

const HEALTH_POLL_MS = 60_000

const MOCK_REPLY =
  'Placeholder response — set VITE_DATA_SOURCE=hybrid (or api) and start the backend to get real answers.'

interface Options {
  greeting: string
}

async function fetchHealth(): Promise<LlmHealth | null> {
  try {
    return await chatApi.health()
  } catch {
    return null
  }
}

function patchActionInMessages(
  messages: AssistantMessage[],
  actionId: string,
  update: (action: ProposedTicketAction) => ProposedTicketAction,
): AssistantMessage[] {
  return messages.map((msg) =>
    msg.action?.id === actionId
      ? { ...msg, action: update(msg.action) }
      : msg,
  )
}

/**
 * Shared assistant conversation state for the full page and the floating widget.
 * Streams replies from the backend, which proxies the configured LLM provider.
 */
export function useAssistantChat({ greeting }: Options) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { id: 'welcome', role: 'assistant', body: greeting },
  ])
  const [mode, setMode] = useState<ChatMode>('quick')
  const [isStreaming, setIsStreaming] = useState(false)
  const [health, setHealth] = useState<LlmHealth | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ticket, setTicket] = useState<EscalatedTicket | null>(null)
  const [isEscalating, setIsEscalating] = useState(false)
  // Mirrors the ref so the UI can react to a conversation existing.
  const [hasConversation, setHasConversation] = useState(false)

  const conversationId = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!usesLiveChat()) return
    let cancelled = false
    const poll = () => {
      void fetchHealth().then((next) => {
        if (!cancelled) setHealth(next)
      })
    }
    poll()
    const timer = window.setInterval(poll, HEALTH_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  const patchMessage = useCallback(
    (id: string, update: (msg: AssistantMessage) => AssistantMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? update(msg) : msg)),
      )
    },
    [],
  )

  const hasOpenAction = messages.some(
    (m) =>
      m.action &&
      (m.action.status === 'pending' ||
        m.action.status === 'editing' ||
        m.action.status === 'executing'),
  )

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      const wantsTicket = isTicketCreateIntent(trimmed)
      const alreadyHasTicket = ticket !== null

      setError(null)
      const stamp = Date.now()
      const botId = `a-${stamp}`
      setMessages((prev) => [
        ...prev,
        { id: `u-${stamp}`, role: 'user', body: trimmed },
      ])

      const openProposal = () => {
        if (!wantsTicket || alreadyHasTicket) return
        setMessages((prev) => withCreateProposalMessage(prev))
      }

      if (!usesLiveChat()) {
        setIsStreaming(true)
        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: botId,
              role: 'assistant',
              body: wantsTicket
                ? 'I opened a ticket proposal from this chat. Review and confirm it below — nothing is filed until you confirm.'
                : MOCK_REPLY,
            },
          ])
          openProposal()
          setIsStreaming(false)
        }, 500)
        return
      }

      setMessages((prev) => [
        ...prev,
        { id: botId, role: 'assistant', body: '', streaming: true },
      ])
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        if (!conversationId.current) {
          conversationId.current = (await chatApi.createConversation()).id
          setHasConversation(true)
        }

        const result = await chatApi.streamMessage(
          conversationId.current,
          trimmed,
          mode,
          {
            onToken: (delta) =>
              patchMessage(botId, (msg) => ({
                ...msg,
                body: msg.body + delta,
              })),
            onCitations: (citations, retrievalWeak) =>
              patchMessage(botId, (msg) => ({
                ...msg,
                citations,
                retrievalWeak,
              })),
            onError: (message) => setError(message),
          },
          controller.signal,
        )

        patchMessage(botId, (msg) => ({
          ...msg,
          body: msg.body || result.botMessage?.content || '',
          citations: result.citations.length ? result.citations : msg.citations,
          retrievalWeak: result.retrievalWeak,
          streaming: false,
        }))
      } catch (err) {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error ? err.message : 'The assistant is unavailable.'
        setError(message)
        patchMessage(botId, (msg) => ({
          ...msg,
          body: msg.body || 'The assistant is unavailable right now.',
          streaming: false,
        }))
        void fetchHealth().then(setHealth)
      } finally {
        abortRef.current = null
        setIsStreaming(false)
        // Open after the reply so the draft includes this turn + prior context.
        openProposal()
      }
    },
    [isStreaming, mode, patchMessage, ticket],
  )

  /** Open a create-ticket proposal card (user must confirm). */
  const proposeCreate = useCallback(() => {
    if (ticket || hasOpenAction || isStreaming) return
    setMessages((prev) =>
      withCreateProposalMessage(prev, {
        intro:
          'Review this ticket before it is filed. You can edit the details or cancel.',
      }),
    )
  }, [ticket, hasOpenAction, isStreaming])

  const proposeUpdate = useCallback(
    (seed?: Partial<TicketUpdateDraft>) => {
      if (hasOpenAction || isStreaming) return
      const action: ProposedTicketAction = {
        id: `act-update-${Date.now()}`,
        kind: 'update',
        status: 'editing',
        update: {
          ticketId: seed?.ticketId ?? ticket?.id ?? '',
          ticketLabel: seed?.ticketLabel ?? ticket?.subject ?? 'Select a ticket',
          status: seed?.status ?? 'in_progress',
          priority: seed?.priority ?? 'medium',
          category: seed?.category,
        },
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `a-action-${Date.now()}`,
          role: 'assistant',
          body: 'Choose a ticket and the fields to update, then confirm.',
          action,
        },
      ])
    },
    [hasOpenAction, isStreaming, ticket],
  )

  const proposeComment = useCallback(
    (seed?: Partial<TicketCommentDraft>) => {
      if (hasOpenAction || isStreaming) return
      const action: ProposedTicketAction = {
        id: `act-comment-${Date.now()}`,
        kind: 'comment',
        status: 'editing',
        comment: {
          ticketId: seed?.ticketId ?? ticket?.id ?? '',
          ticketLabel: seed?.ticketLabel ?? ticket?.subject ?? 'Select a ticket',
          body: seed?.body ?? '',
        },
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `a-action-${Date.now()}`,
          role: 'assistant',
          body: 'Pick a ticket and write the comment, then confirm.',
          action,
        },
      ])
    },
    [hasOpenAction, isStreaming, ticket],
  )

  const beginEditAction = useCallback((actionId: string) => {
    setMessages((prev) =>
      patchActionInMessages(prev, actionId, (action) => ({
        ...action,
        status: 'editing',
        error: undefined,
      })),
    )
  }, [])

  const saveEditAction = useCallback((next: ProposedTicketAction) => {
    setMessages((prev) =>
      patchActionInMessages(prev, next.id, () => ({
        ...next,
        status: 'pending',
        error: undefined,
      })),
    )
  }, [])

  const cancelEditAction = useCallback((actionId: string) => {
    setMessages((prev) =>
      patchActionInMessages(prev, actionId, (action) => ({
        ...action,
        status: 'pending',
      })),
    )
  }, [])

  const cancelAction = useCallback((actionId: string) => {
    setMessages((prev) =>
      patchActionInMessages(prev, actionId, (action) => ({
        ...action,
        status: 'cancelled',
      })),
    )
  }, [])

  const confirmAction = useCallback(async (actionId: string) => {
    const current = messages.find((m) => m.action?.id === actionId)?.action
    if (!current || current.status === 'executing') return

    setMessages((prev) =>
      patchActionInMessages(prev, actionId, (action) => ({
        ...action,
        status: 'executing',
        error: undefined,
      })),
    )
    setIsEscalating(true)
    setError(null)

    try {
      if (current.kind === 'create' && current.create) {
        const created = await ticketsApi.create({
          subject: current.create.subject,
          description: current.create.description,
          category: current.create.category,
          priority: current.create.priority,
        })

        const escalated: EscalatedTicket = {
          id: created.id,
          subject: created.subject,
          status: created.status,
          category: created.category,
        }
        setTicket(escalated)
        setMessages((prev) =>
          patchActionInMessages(prev, actionId, (action) => ({
            ...action,
            status: 'completed',
            resultTicketId: created.id,
            resultSubject: created.subject,
          })),
        )
        return
      }

      if (current.kind === 'update' && current.update?.ticketId) {
        const updated = await ticketsApi.update(current.update.ticketId, {
          status: current.update.status,
          priority: current.update.priority,
          category: current.update.category,
        })
        setMessages((prev) =>
          patchActionInMessages(prev, actionId, (action) => ({
            ...action,
            status: 'completed',
            resultTicketId: updated.id,
            resultSubject: updated.subject,
          })),
        )
        return
      }

      if (current.kind === 'comment' && current.comment?.ticketId) {
        await ticketsApi.addComment(current.comment.ticketId, {
          body: current.comment.body,
        })
        setMessages((prev) =>
          patchActionInMessages(prev, actionId, (action) => ({
            ...action,
            status: 'completed',
            resultTicketId: current.comment!.ticketId,
            resultSubject: current.comment!.ticketLabel,
          })),
        )
        return
      }

      throw new Error('Ticket action is incomplete — edit the details first.')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not complete ticket action.'
      setError(message)
      setMessages((prev) =>
        patchActionInMessages(prev, actionId, (action) => ({
          ...action,
          status: 'failed',
          error: message,
        })),
      )
    } finally {
      setIsEscalating(false)
    }
  }, [messages])

  /**
   * Legacy immediate escalate — kept for callers that still need the
   * transcript-linked backend path. Prefer proposeCreate → confirmAction.
   */
  const escalate = useCallback(async (): Promise<EscalatedTicket | null> => {
    proposeCreate()
    return null
  }, [proposeCreate])

  return {
    messages,
    send,
    isStreaming,
    mode,
    setMode,
    error,
    health,
    /** True only when we know the provider is reachable-but-broken or down. */
    llmOffline: health !== null && health.status !== 'online',
    escalate,
    proposeCreate,
    proposeUpdate,
    proposeComment,
    beginEditAction,
    saveEditAction,
    cancelEditAction,
    cancelAction,
    confirmAction,
    isEscalating,
    ticket,
    hasOpenAction,
    canEscalate:
      hasConversation &&
      ticket === null &&
      !isStreaming &&
      !hasOpenAction,
    /** Propose when there is user context and no open card / filed ticket. */
    canProposeCreate:
      ticket === null &&
      !isStreaming &&
      !hasOpenAction &&
      messages.some((m) => m.role === 'user'),
  }
}
