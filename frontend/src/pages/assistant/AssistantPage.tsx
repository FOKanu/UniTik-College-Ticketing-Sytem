import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { Button, ButtonLink, Input } from '@/components/ui'
import { IconAlert, IconSend } from '@/components/ui/icons'
import { suggestedTopics } from '@/mocks/data'
import styles from './AssistantPage.module.css'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  body: string
  source?: string
  showTicketCta?: boolean
}

const initial: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    body: 'Hi! Ask anything about academics, IT, finance, or maintenance.',
  },
]

export function AssistantPage() {
  const [messages, setMessages] = useState(initial)
  const [draft, setDraft] = useState('')

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      body: trimmed,
    }
    const reply: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      body:
        'I found a related guide. If this does not fix it, you can create a ticket from this chat.',
      source: 'IT Self-Service Guide',
      showTicketCta: true,
    }
    setMessages((prev) => [...prev, userMsg, reply])
    setDraft('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    send(draft)
  }

  return (
    <div className={styles.page}>
      <header>
        <h1>AI Assistant</h1>
        <p>Ask anything about academics, IT, finance, or maintenance.</p>
      </header>

      <div className={styles.banner} role="status">
        <IconAlert width={18} height={18} />
        <p>
          AI responses are currently in development. Answers are sample
          placeholders and may not reflect live campus knowledge.
        </p>
      </div>

      <div className={styles.layout}>
        <section className={styles.chat} aria-label="AI chat">
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
                <p>{msg.body}</p>
                {msg.source ? <small>Source: {msg.source}</small> : null}
                {msg.showTicketCta ? (
                  <Link to={ROUTES.ticketNew} className={styles.ticketCta}>
                    Create Ticket from This Chat
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
          <form className={styles.composer} onSubmit={handleSubmit}>
            <Input
              id="ask"
              label="Your question"
              placeholder="Ask a question..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit">
              <IconSend width={16} height={16} />
              Send
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
                    onClick={() => send(topic)}
                  >
                    {topic}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className={styles.escalate}>
            <h2>Still stuck?</h2>
            <p>Escalate this conversation to a support ticket anytime.</p>
            <ButtonLink to={ROUTES.ticketNew} variant="secondary">
              Create Ticket
            </ButtonLink>
          </section>
        </aside>
      </div>
    </div>
  )
}
