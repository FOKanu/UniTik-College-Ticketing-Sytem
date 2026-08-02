import { useAuthStore } from '@/stores/authStore'
import { type Envelope, unwrap as unwrapEnvelope } from './adapters'
import { apiBaseUrl, get, mockLatency, post, usesLiveChat } from './client'
import { ApiError, type ApiErrorCode } from './errors'

export type ChatMode = 'quick' | 'detailed'

export interface ChatConversation {
  id: string
  userId: string
  escalatedTicketId: string | null
  startedAt: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  sender: 'user' | 'bot'
  content: string
  createdAt: string
}

export interface EscalatedTicket {
  id: string
  subject: string
  status: string
  category: string | null
}

export interface EscalateResult {
  conversation: ChatConversation
  ticketId: string
  ticket: EscalatedTicket
  /** True when this conversation already had a ticket — none was created. */
  alreadyEscalated: boolean
  botMessage: ChatMessage | null
}

export interface LlmHealth {
  status: 'online' | 'offline' | 'unconfigured'
  provider: string
  model: string
  baseUrl: string
  modelAvailable?: boolean | null
  error?: string
}

/** The FastAPI backend wraps every payload in `{ success, data }`. */
/** Awaiting wrapper around the shared envelope unwrapper. */
async function unwrap<T>(request: Promise<Envelope<T>>): Promise<T> {
  return unwrapEnvelope(await request)
}

/** Mirrors the status mapping axios responses get in `toApiError`. */
function codeForStatus(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 400 || status === 422) return 'VALIDATION'
  if (status >= 500) return 'SERVER'
  return 'UNKNOWN'
}

function authHeaders(): Record<string, string> {
  const { accessToken } = useAuthStore.getState()
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

export interface StreamHandlers {
  onStart?: (userMessage: ChatMessage) => void
  onToken?: (delta: string) => void
  onError?: (message: string) => void
}

interface SseEvent {
  event: string
  data: unknown
}

/** Parses `event:`/`data:` frames out of a raw SSE byte stream. */
async function* readSse(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let split = buffer.indexOf('\n\n')
      while (split !== -1) {
        const frame = buffer.slice(0, split)
        buffer = buffer.slice(split + 2)
        split = buffer.indexOf('\n\n')

        let event = 'message'
        const dataLines: string[] = []
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim()
          else if (line.startsWith('data:'))
            dataLines.push(line.slice(5).trim())
        }
        if (dataLines.length === 0) continue
        try {
          yield { event, data: JSON.parse(dataLines.join('\n')) }
        } catch {
          // A truncated frame is not worth failing the whole stream over.
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export const chatApi = {
  async createConversation(): Promise<ChatConversation> {
    return unwrap(post<Envelope<ChatConversation>>('/chat/conversations', {}))
  },

  async listMessages(conversationId: string): Promise<ChatMessage[]> {
    return unwrap(
      get<Envelope<ChatMessage[]>>(
        `/chat/conversations/${conversationId}/messages`,
      ),
    )
  },

  async escalate(conversationId: string): Promise<EscalateResult> {
    return unwrap(
      post<Envelope<EscalateResult>>(
        `/chat/conversations/${conversationId}/escalate`,
      ),
    )
  },

  async health(): Promise<LlmHealth> {
    if (!usesLiveChat()) {
      await mockLatency(120)
      return {
        status: 'unconfigured',
        provider: 'mock',
        model: 'mock',
        baseUrl: '',
      }
    }
    return unwrap(get<Envelope<LlmHealth>>('/chat/health'))
  },

  /**
   * Streams a reply token-by-token. Resolves with the persisted bot message
   * once the backend has written it, even when the model was unreachable.
   */
  async streamMessage(
    conversationId: string,
    content: string,
    mode: ChatMode,
    handlers: StreamHandlers = {},
    signal?: AbortSignal,
  ): Promise<ChatMessage | null> {
    const response = await fetch(
      `${apiBaseUrl}/chat/conversations/${conversationId}/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...authHeaders(),
        },
        body: JSON.stringify({ content, mode }),
        signal,
      },
    )

    if (!response.ok || !response.body) {
      let message = `Assistant request failed (${response.status})`
      try {
        const body = (await response.json()) as Envelope<unknown>
        if (body?.error?.message) message = body.error.message
      } catch {
        // Non-JSON error body; keep the status-based message.
      }
      throw new ApiError(message, {
        code: codeForStatus(response.status),
        status: response.status,
      })
    }

    let botMessage: ChatMessage | null = null

    for await (const { event, data } of readSse(response.body)) {
      const payload = data as Record<string, unknown>
      if (event === 'start') {
        handlers.onStart?.(payload.userMessage as ChatMessage)
      } else if (event === 'token') {
        handlers.onToken?.(String(payload.delta ?? ''))
      } else if (event === 'error') {
        handlers.onError?.(
          String(payload.message ?? 'The assistant is unavailable.'),
        )
      } else if (event === 'done') {
        botMessage = payload.botMessage as ChatMessage
      }
    }

    return botMessage
  },
}
