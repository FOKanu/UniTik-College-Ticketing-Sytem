import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  } = useAssistantChat({ greeting: 'Hi — how can I help?' })
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
          aria-label="AI Assistant"
        >
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <IconChat width={18} height={18} />
              <div>
                <strong>AI Assistant</strong>
                <span>
                  {llmOffline
                    ? 'LLM server offline'
                    : (health?.model ?? 'Ready')}
                </span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Open full assistant"
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
                aria-label="Close AI assistant"
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
                      escalateLabel="Create ticket"
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
                <small>{msg.role === 'user' ? 'You' : 'Assistant'}</small>
              </div>
            ))}
            {isStreaming ? (
              <div className={styles.typing} aria-label="Assistant is typing">
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
              <span className="sr-only">Ask a question</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask a question..."
              />
              <button
                type="button"
                className={styles.attach}
                aria-label="Attach file"
                disabled
              >
                <IconPaperclip width={16} height={16} />
              </button>
            </label>
            <Button
              type="submit"
              size="sm"
              aria-label="Send"
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
                View ticket: {ticket.subject}
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
                    Propose ticket
                  </button>
                ) : (
                  'Escape closes'
                )}
                {' · '}
                <Link to={ROUTES.assistant} onClick={() => setOpen(false)}>
                  Open full chat
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
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
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
