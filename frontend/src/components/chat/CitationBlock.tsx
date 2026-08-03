import type { Citation } from '@/lib/api'
import { toDepartment } from '@/lib/api/adapters'
import { DepartmentBadge } from '@/components/ui'
import { IconAlert } from '@/components/ui/icons'
import styles from './CitationBlock.module.css'

const MAX_SOURCES = 3

interface CitationBlockProps {
  citations: Citation[]
  retrievalWeak?: boolean
  /** Tighter spacing/typography for the ChatbotFab panel. */
  compact?: boolean
  /** Escalate affordance shown on weak retrieval. Reuses the surface's wording. */
  canEscalate?: boolean
  isEscalating?: boolean
  onEscalate?: () => void
  escalateLabel?: string
}

/**
 * Compact "Sources" block rendered under an assistant message.
 * Renders identically in AssistantPage and ChatbotFab — keep it dumb:
 * everything it shows comes from the chat API envelope.
 */
export function CitationBlock({
  citations,
  retrievalWeak = false,
  compact = false,
  canEscalate = false,
  isEscalating = false,
  onEscalate,
  escalateLabel = 'Escalate to Ticket',
}: CitationBlockProps) {
  const sources = citations.slice(0, MAX_SOURCES)
  if (!retrievalWeak && sources.length === 0) return null

  return (
    <div
      className={compact ? `${styles.block} ${styles.compact}` : styles.block}
    >
      {retrievalWeak ? (
        <p className={styles.weak} role="note">
          <IconAlert width={14} height={14} aria-hidden="true" />
          <span>
            No strong match in the knowledge base — this answer may be
            incomplete. Double-check anything important.
          </span>
        </p>
      ) : null}

      {sources.length > 0 ? (
        <>
          <p className={styles.label}>
            {retrievalWeak ? 'Closest articles' : 'Sources'}
            <span className={styles.origin}>· knowledge base</span>
          </p>
          <ul className={styles.list}>
            {sources.map((citation) => (
              <li key={citation.id} className={styles.item}>
                <span className={styles.question}>{citation.question}</span>
                {citation.category ? (
                  <DepartmentBadge
                    department={toDepartment(citation.category)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {retrievalWeak && canEscalate && onEscalate ? (
        <button
          type="button"
          className={styles.escalateBtn}
          disabled={isEscalating}
          onClick={onEscalate}
        >
          {isEscalating ? 'Creating ticket…' : escalateLabel}
        </button>
      ) : null}
    </div>
  )
}
