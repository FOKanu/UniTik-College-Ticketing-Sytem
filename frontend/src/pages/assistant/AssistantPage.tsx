import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonLink, Button, Input } from '@/components/ui'
import { IconAlert, IconSend } from '@/components/ui/icons'
import { CitationBlock } from '@/components/chat/CitationBlock'
import { TicketActionCard } from '@/components/chat/TicketActionCard'
import { ROUTES, ticketDetailPath } from '@/app/routes'
import { useAssistantChat } from '@/hooks'
import { usesLiveChat } from '@/lib/api'
import styles from './AssistantPage.module.css'

const MODES = [{ id: 'quick', key: 'chatbot.quick' }, { id: 'detailed', key: 'chatbot.detailed' }] as const

export function AssistantPage() {
  const { t } = useTranslation()
  const suggestedTopics = [t('chatbot.topics.password'), t('chatbot.topics.wifi'), t('chatbot.topics.tuition')]
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
    canProposeCreate,
  } = useAssistantChat({
    greeting: t('chatbot.greeting'),
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
        <h1>{t('nav.assistant')}</h1>
        <p>{t('chatbot.subtitle')}</p>
      </header>

      {llmOffline ? (
        <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
          <IconAlert width={18} height={18} />
          <p>
            {t('chatbot.offlineDetail')}
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
              ? t('chatbot.disclaimer')
              : t('chatbot.mockNotice')}
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
        <section className={styles.chat} aria-label={t('chatbot.chat')}>
          <div>
            <div
              className={styles.modes}
              role="group"
              aria-label={t('chatbot.answerStyle')}
            >
              {MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={styles.modeBtn}
                  aria-pressed={mode === option.id}
                  onClick={() => setMode(option.id)}
                >
                  {t(option.key)}
                </button>
              ))}
            </div>

            <div
              className={styles.messages}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-label={t('chatbot.messages')}
            >
              {messages.map((msg) => (
                <article
                  key={msg.id}
                  className={msg.role === 'user' ? styles.mine : styles.theirs}
                  aria-label={t('chatbot.said', { speaker: t(msg.role === 'user' ? 'chatbot.you' : 'chatbot.assistant') })}
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
                      canEscalate={canProposeCreate}
                      isEscalating={isEscalating}
                      onEscalate={() => proposeCreate()}
                    />
                  ) : null}
                  {msg.role === 'assistant' && msg.action ? (
                    <TicketActionCard
                      action={msg.action}
                      onConfirm={() => void confirmAction(msg.action!.id)}
                      onCancel={() => cancelAction(msg.action!.id)}
                      onBeginEdit={() => beginEditAction(msg.action!.id)}
                      onSaveEdit={saveEditAction}
                      onCancelEdit={() => cancelEditAction(msg.action!.id)}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <form className={styles.composer} onSubmit={handleSubmit}>
            <Input
              id="ask"
              label={t('chatbot.question')}
              placeholder={t('chatbot.askPlaceholder')}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" disabled={isStreaming}>
              <IconSend width={16} height={16} />
              {isStreaming ? t('chatbot.thinking') : t('chatbot.send')}
            </Button>
          </form>
        </section>

        <aside className={styles.aside}>
          <section className={styles.panel}>
            <h2>{t('chatbot.suggested')}</h2>
            <ul>
              {suggestedTopics.map((topic) => (
                <li key={topic}>
                  <button
                    type="button"
                    aria-label={t('chatbot.askAbout', { topic })}
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
                <h2>{t('chatbot.ticketCreated')}</h2>
                <p className={styles.ticketSubject}>{ticket.subject}</p>
                <p>
                  {t('chatbot.followUp')}
                </p>
                <div className={styles.escalateActions}>
                  <ButtonLink
                    to={ticketDetailPath(ticket.id)}
                    variant="secondary"
                  >
                    {t('chatbot.viewTicket')}
                  </ButtonLink>
                  <Button
                    variant="secondary"
                    disabled={isEscalating}
                    onClick={() =>
                      proposeComment({
                        ticketId: ticket.id,
                        ticketLabel: ticket.subject,
                      })
                    }
                  >
                    {t('chatbot.addComment')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2>{t('chatbot.stillStuck')}</h2>
                <p>
                  {canProposeCreate
                    ? t('chatbot.proposeHelp')
                    : t('chatbot.askFirst')}
                </p>
                <div className={styles.escalateActions}>
                  {canProposeCreate ? (
                    <Button
                      variant="secondary"
                      disabled={isEscalating}
                      onClick={() => proposeCreate()}
                    >
                      {t('chatbot.proposeTicket')}
                    </Button>
                  ) : (
                    <ButtonLink to={ROUTES.ticketNew} variant="secondary">
                      {t('tickets.create')}
                    </ButtonLink>
                  )}
                  <Button
                    variant="secondary"
                    disabled={isEscalating}
                    onClick={() => proposeUpdate()}
                  >
                    {t('chatbot.updateTicket')}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={isEscalating}
                    onClick={() => proposeComment()}
                  >
                    {t('chatbot.addComment')}
                  </Button>
                </div>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
