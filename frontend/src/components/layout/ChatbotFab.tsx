import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { Button } from '@/components/ui'
import {
  IconChat,
  IconClose,
  IconExternal,
  IconPaperclip,
  IconSend,
} from '@/components/ui/icons'
import { useDialogFocus } from '@/hooks/useDialogFocus'
import styles from './ChatbotFab.module.css'

interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  body: string
}

const welcome: ChatMsg = {
  id: 'welcome',
  role: 'assistant',
  body: 'Hi — how can I help?',
}

export function ChatbotFab() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([welcome])
  const [typing, setTyping] = useState(false)
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useDialogFocus({
    open,
    containerRef: panelRef,
    triggerRef: buttonRef,
    onClose: () => setOpen(false),
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
  }, [messages, typing, open])

  function send() {
    const text = draft.trim()
    if (!text) return
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      body: text,
    }
    setMessages((prev) => [...prev, userMsg])
    setDraft('')
    setTyping(true)
    window.setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          body: 'Placeholder response — open the full assistant for more help, or create a ticket.',
        },
      ])
    }, 700)
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
                <span>Placeholder responses</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Open full assistant"
                onClick={() => {
                  setOpen(false)
                  void navigate(ROUTES.assistant)
                }}
              >
                <IconExternal width={16} height={16} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Close AI assistant"
                onClick={() => setOpen(false)}
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
                <small>{msg.role === 'user' ? 'You' : 'Assistant'}</small>
              </div>
            ))}
            {typing ? (
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
              send()
            }}
          >
            <label className={styles.inputWrap}>
              <span className="sr-only">Ask a question</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask a question..."
              />
              <button type="button" className={styles.attach} aria-label="Attach file" disabled>
                <IconPaperclip width={16} height={16} />
              </button>
            </label>
            <Button type="submit" size="sm" aria-label="Send">
              <IconSend width={16} height={16} />
            </Button>
          </form>
          <p className={styles.hint}>
            Escape closes ·{' '}
            <Link to={ROUTES.assistant} onClick={() => setOpen(false)}>
              Open full chat
            </Link>
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
        {open ? <IconClose width={22} height={22} /> : <IconChat width={22} height={22} />}
      </button>
    </div>
  )
}
