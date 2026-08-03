import { useCallback, useEffect, useRef, useState } from 'react'
import {
  chatApi,
  usesLiveChat,
  type ChatMode,
  type Citation,
  type EscalatedTicket,
  type LlmHealth,
} from '@/lib/api'

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  body: string
  streaming?: boolean
  /** KB articles the answer was grounded in (live chat only). */
  citations?: Citation[]
  /** True when no KB article matched strongly — treat the answer with care. */
  retrievalWeak?: boolean
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

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      setError(null)
      const stamp = Date.now()
      const botId = `a-${stamp}`
      setMessages((prev) => [
        ...prev,
        { id: `u-${stamp}`, role: 'user', body: trimmed },
      ])

      if (!usesLiveChat()) {
        setIsStreaming(true)
        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { id: botId, role: 'assistant', body: MOCK_REPLY },
          ])
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
            // Citations arrive with the SSE start event, so sources can
            // render while the answer is still streaming.
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

        // The persisted message is authoritative — it carries the offline
        // fallback text when the model never produced any tokens.
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
      }
    },
    [isStreaming, mode, patchMessage],
  )

  /** Turns the conversation into a support ticket. Safe to call twice. */
  const escalate = useCallback(async (): Promise<EscalatedTicket | null> => {
    const id = conversationId.current
    if (!id || isEscalating) return null

    setIsEscalating(true)
    setError(null)
    try {
      const result = await chatApi.escalate(id)
      setTicket(result.ticket)
      if (result.botMessage) {
        setMessages((prev) => [
          ...prev,
          {
            id: result.botMessage!.id,
            role: 'assistant',
            body: result.botMessage!.content,
          },
        ])
      }
      return result.ticket
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create a ticket.',
      )
      return null
    } finally {
      setIsEscalating(false)
    }
  }, [isEscalating])

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
    isEscalating,
    ticket,
    canEscalate: hasConversation && ticket === null && !isStreaming,
  }
}
