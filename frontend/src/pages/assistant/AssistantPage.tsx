import { useState } from 'react'
import type { FormEvent } from 'react'
import { ButtonLink, Button, Input } from '@/components/ui'
import { IconAlert, IconSend } from '@/components/ui/icons'
import { CitationBlock } from '@/components/chat/CitationBlock'
import { ROUTES, ticketDetailPath } from '@/app/routes'
import { useAssistantChat } from '@/hooks'
import { usesLiveChat } from '@/lib/api'
import { suggestedTopics } from '@/mocks/data'
import styles from './AssistantPage.module.css'

const MODES = [
  { id: 'quick', label: 'Quick Answer' },
  { id: 'detailed', label: 'Detailed' },
] as const

export function AssistantPage() {
  const [draft, setDraft] = useState('')
  const {
    messages,
    send,
    isStreaming,
    mode,
    setMode,
    error,
    health,
    llmOffline,
    escalate,
    isEscalating,
    ticket,
    canEscalate,
  } = useAssistantChat({
    greeting: 'Hi! Ask anything about academics, IT, finance, or maintenance.',
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void send(draft)
    setDraft('')
  }

  function handleTopic(topic: string) {
    void send(topic)
    setDraft('')
  }

  return (
    <div className={styles.page}>
      <header>
        <h1>AI Assistant</h1>
        <p>Ask anything about academics, IT, finance, or maintenance.</p>
      </header>

      {llmOffline ? (
        <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
          <IconAlert width={18} height={18} />
          <p>
            LLM server offline — the assistant can&apos;t answer right now.
            Start Ollama on the GPU server and make sure the tunnel is open.
            {health ? (
              <>
                {' '}
                <code>
                  {health.provider} · {health.model} · {health.baseUrl}
                </code>
              </>
            ) : null}
          </p>
        </div>
      ) : (
        <div className={styles.banner} role="status">
          <IconAlert width={18} height={18} />
          <p>
            {usesLiveChat()
              ? 'Answers are AI-generated. Verify anything important, and escalate to a ticket for decisions a person must make.'
              : 'Running on mock data. Set VITE_DATA_SOURCE=hybrid to talk to the real assistant.'}
          </p>
        </div>
      )}

      {error && !llmOffline ? (
        <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
          <IconAlert width={18} height={18} />
          <p>{error}</p>
        </div>
      ) : null}

      <div className={styles.layout}>
        <section className={styles.chat} aria-label="AI chat">
          <div>
            <div
              className={styles.modes}
              role="group"
              aria-label="Answer style"
            >
              {MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={styles.modeBtn}
                  aria-pressed={mode === option.id}
                  onClick={() => setMode(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div
              className={styles.messages}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-label="Chat messages"
            >
              {messages.map((msg) => (
                <article
                  key={msg.id}
                  className={msg.role === 'user' ? styles.mine : styles.theirs}
                  aria-label={`${msg.role === 'user' ? 'You' : 'Assistant'} said`}
                >
                  <p>
                    {msg.body}
                    {msg.streaming ? (
                      <span className={styles.caret}>▍</span>
                    ) : null}
                  </p>
                  {msg.role === 'assistant' &&
                  (msg.citations?.length || msg.retrievalWeak) ? (
                    <CitationBlock
                      citations={msg.citations ?? []}
                      retrievalWeak={msg.retrievalWeak}
                      canEscalate={canEscalate}
                      isEscalating={isEscalating}
                      onEscalate={() => void escalate()}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <form className={styles.composer} onSubmit={handleSubmit}>
            <Input
              id="ask"
              label="Your question"
              placeholder="Ask a question..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" disabled={isStreaming}>
              <IconSend width={16} height={16} />
              {isStreaming ? 'Thinking…' : 'Send'}
            </Button>
          </form>
        </section>

        <aside className={styles.aside}>
          <section className={styles.panel}>
            <h2>Suggested topics</h2>
            <ul>
              {suggestedTopics.map((topic) => (
                <li key={topic}>
                  <button
                    type="button"
                    aria-label={`Ask about ${topic}`}
                    disabled={isStreaming}
                    onClick={() => handleTopic(topic)}
                  >
                    {topic}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className={styles.escalate}>
            {ticket ? (
              <>
                <h2>Ticket created</h2>
                <p className={styles.ticketSubject}>{ticket.subject}</p>
                <p>
                  A support agent will follow up there. The full conversation is
                  attached.
                </p>
                <ButtonLink
                  to={ticketDetailPath(ticket.id)}
                  variant="secondary"
                >
                  View ticket
                </ButtonLink>
              </>
            ) : (
              <>
                <h2>Still stuck?</h2>
                <p>
                  {canEscalate
                    ? 'Turn this conversation into a support ticket. The transcript comes with it.'
                    : 'Ask a question first, then you can escalate the conversation to a ticket.'}
                </p>
                {canEscalate ? (
                  <Button
                    variant="secondary"
                    disabled={isEscalating}
                    onClick={() => void escalate()}
                  >
                    {isEscalating ? 'Creating ticket…' : 'Escalate to Ticket'}
                  </Button>
                ) : (
                  <ButtonLink to={ROUTES.ticketNew} variant="secondary">
                    Create Ticket
                  </ButtonLink>
                )}
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
