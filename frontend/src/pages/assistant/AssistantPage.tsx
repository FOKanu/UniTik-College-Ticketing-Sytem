import { useState } from 'react'
import type { FormEvent } from 'react'
import { ButtonLink, Button, Input } from '@/components/ui'
import { IconAlert, IconSend } from '@/components/ui/icons'
import { CitationBlock } from '@/components/chat/CitationBlock'
import { TicketActionCard } from '@/components/chat/TicketActionCard'
import { ROUTES, ticketDetailPath } from '@/app/routes'
import { useAssistantChat } from '@/hooks'
import { usesLiveChat } from '@/lib/api'
import { useT } from '@/lib/i18n'
import styles from './AssistantPage.module.css'

export function AssistantPage() {
  const t = useT()
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
    greeting: t('assistant.greeting'),
  })

  const modes = [
    { id: 'quick' as const, label: t('assistant.mode.quick') },
    { id: 'detailed' as const, label: t('assistant.mode.detailed') },
  ]

  const topics = [
    t('assistant.topic.password'),
    t('assistant.topic.wifi'),
    t('assistant.topic.tuition'),
  ]

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
        <h1>{t('assistant.title')}</h1>
        <p>{t('assistant.subtitle')}</p>
      </header>

      {llmOffline ? (
        <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
          <IconAlert width={18} height={18} />
          <p>
            {t('assistant.llmOffline')}
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
              ? t('assistant.bannerLive')
              : t('assistant.bannerMock')}
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
        <section className={styles.chat} aria-label={t('assistant.chatAria')}>
          <div>
            <div
              className={styles.modes}
              role="group"
              aria-label={t('assistant.answerStyle')}
            >
              {modes.map((option) => (
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
              aria-label={t('assistant.messagesAria')}
            >
              {messages.map((msg) => (
                <article
                  key={msg.id}
                  className={msg.role === 'user' ? styles.mine : styles.theirs}
                  aria-label={
                    msg.role === 'user'
                      ? t('assistant.youSaid')
                      : t('assistant.assistantSaid')
                  }
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
              label={t('assistant.questionLabel')}
              placeholder={t('assistant.placeholder')}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" disabled={isStreaming}>
              <IconSend width={16} height={16} />
              {isStreaming ? t('assistant.thinking') : t('assistant.send')}
            </Button>
          </form>
        </section>

        <aside className={styles.aside}>
          <section className={styles.panel}>
            <h2>{t('assistant.topics')}</h2>
            <ul>
              {topics.map((topic) => (
                <li key={topic}>
                  <button
                    type="button"
                    aria-label={t('assistant.askAbout', { topic })}
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
                <h2>{t('assistant.ticketCreated')}</h2>
                <p className={styles.ticketSubject}>{ticket.subject}</p>
                <p>{t('assistant.ticketFollowUp')}</p>
                <div className={styles.escalateActions}>
                  <ButtonLink
                    to={ticketDetailPath(ticket.id)}
                    variant="secondary"
                  >
                    {t('assistant.viewTicket')}
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
                    {t('assistant.addComment')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2>{t('assistant.stillStuck')}</h2>
                <p>
                  {canProposeCreate
                    ? t('assistant.proposeHint')
                    : t('assistant.askFirst')}
                </p>
                <div className={styles.escalateActions}>
                  {canProposeCreate ? (
                    <Button
                      variant="secondary"
                      disabled={isEscalating}
                      onClick={() => proposeCreate()}
                    >
                      {t('assistant.proposeTicket')}
                    </Button>
                  ) : (
                    <ButtonLink to={ROUTES.ticketNew} variant="secondary">
                      {t('assistant.createTicket')}
                    </ButtonLink>
                  )}
                  <Button
                    variant="secondary"
                    disabled={isEscalating}
                    onClick={() => proposeUpdate()}
                  >
                    {t('assistant.updateTicket')}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={isEscalating}
                    onClick={() => proposeComment()}
                  >
                    {t('assistant.addComment')}
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
