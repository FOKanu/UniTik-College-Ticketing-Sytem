import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES, ticketDetailPath } from '@/app/routes'
import { Button } from '@/components/ui'
import {
  IconChat,
  IconClose,
  IconExternal,
  IconPaperclip,
  IconSend,
} from '@/components/ui/icons'
import { useAssistantChat } from '@/hooks/useAssistantChat'
import { useDialogFocus } from '@/hooks/useDialogFocus'
import { CitationBlock } from '@/components/chat/CitationBlock'
import { TicketActionCard } from '@/components/chat/TicketActionCard'
import styles from './ChatbotFab.module.css'

export function ChatbotFab() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const {
    messages,
    send,
    isStreaming,
    health,
    llmOffline,
    proposeCreate,
    beginEditAction,
    saveEditAction,
    cancelEditAction,
    cancelAction,
    confirmAction,
    isEscalating,
    ticket,
    canProposeCreate,
  } = useAssistantChat({ greeting: t('chatbot.greetingShort') })
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const closePanel = useCallback(() => setOpen(false), [])

  useDialogFocus({
    open,
    containerRef: panelRef,
    triggerRef: buttonRef,
    onClose: closePanel,
  })

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, isStreaming, open])

  function submit() {
    void send(draft)
    setDraft('')
  }

  return (
    <div className={styles.root}>
      {open ? (
        <div
          id={panelId}
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.assistant')}
        >
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <IconChat width={18} height={18} />
              <div>
                <strong>{t('nav.assistant')}</strong>
                <span>
                  {llmOffline
                    ? t('chatbot.offline')
                    : (health?.model ?? t('chatbot.ready'))}
                </span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={t('chatbot.openFull')}
                onClick={() => {
                  closePanel()
                  void navigate(ROUTES.assistant)
                }}
              >
                <IconExternal width={16} height={16} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={t('common.close')}
                onClick={closePanel}
              >
                <IconClose width={16} height={16} />
              </button>
            </div>
          </header>

          <div
            ref={listRef}
            className={styles.messages}
            role="log"
            aria-live="polite"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.role === 'user' ? styles.mine : styles.theirs}
              >
                <p>{msg.body}</p>
                {msg.role === 'assistant' &&
                (msg.citations?.length || msg.retrievalWeak) ? (
                  <div className={styles.citations}>
                    <CitationBlock
                      compact
                      citations={msg.citations ?? []}
                      retrievalWeak={msg.retrievalWeak}
                      canEscalate={canProposeCreate}
                      isEscalating={isEscalating}
                      onEscalate={() => proposeCreate()}
                      escalateLabel={t('chatbot.createTicket')}
                    />
                  </div>
                ) : null}
                {msg.role === 'assistant' && msg.action ? (
                  <div className={styles.citations}>
                    <TicketActionCard
                      compact
                      action={msg.action}
                      onConfirm={() => void confirmAction(msg.action!.id)}
                      onCancel={() => cancelAction(msg.action!.id)}
                      onBeginEdit={() => beginEditAction(msg.action!.id)}
                      onSaveEdit={saveEditAction}
                      onCancelEdit={() => cancelEditAction(msg.action!.id)}
                    />
                  </div>
                ) : null}
                <small>{msg.role === 'user' ? t('chatbot.you') : t('chatbot.assistant')}</small>
              </div>
            ))}
            {isStreaming ? (
              <div className={styles.typing} aria-label={t('chatbot.typing')}>
                <span />
                <span />
                <span />
              </div>
            ) : null}
          </div>

          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <label className={styles.inputWrap}>
              <span className="sr-only">{t('chatbot.question')}</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t('chatbot.askPlaceholder')}
              />
              <button
                type="button"
                className={styles.attach}
                aria-label={t('chatbot.attach')}
                disabled
              >
                <IconPaperclip width={16} height={16} />
              </button>
            </label>
            <Button
              type="submit"
              size="sm"
              aria-label={t('chatbot.send')}
              disabled={isStreaming}
            >
              <IconSend width={16} height={16} />
            </Button>
          </form>
          <p className={styles.hint}>
            {ticket ? (
              <Link
                to={ticketDetailPath(ticket.id)}
                onClick={() => setOpen(false)}
              >
                {t('chatbot.viewTicketNamed', { subject: ticket.subject })}
              </Link>
            ) : (
              <>
                {canProposeCreate ? (
                  <button
                    type="button"
                    className={styles.hintBtn}
                    disabled={isEscalating}
                    onClick={() => proposeCreate()}
                  >
                    {t('chatbot.proposeTicket')}
                  </button>
                ) : (
                  t('chatbot.escape')
                )}
                {' · '}
                <Link to={ROUTES.assistant} onClick={() => setOpen(false)}>
                  {t('chatbot.openFullChat')}
                </Link>
              </>
            )}
          </p>
        </div>
      ) : null}

      <button
        ref={buttonRef}
        type="button"
        className={styles.fab}
        aria-label={t(open ? 'chatbot.closeAssistant' : 'chatbot.openAssistant')}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <IconClose width={22} height={22} />
        ) : (
          <IconChat width={22} height={22} />
        )}
      </button>
    </div>
  )
}
