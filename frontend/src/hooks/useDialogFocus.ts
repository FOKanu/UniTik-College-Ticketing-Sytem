import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

interface UseDialogFocusOptions {
  open: boolean
  containerRef: RefObject<HTMLElement | null>
  triggerRef: RefObject<HTMLElement | null>
  onClose?: () => void
}

function isFocusable(node: HTMLElement): boolean {
  if (node.hasAttribute('disabled')) return false
  if (node.getAttribute('aria-disabled') === 'true') return false
  return true
}

function listFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE),
  ).filter(isFocusable)
}

/**
 * Focus trap for lightweight dialogs (chat FAB, notification flyout).
 *
 * Important: initial focus runs only when `open` becomes true. `onClose` is
 * read from a ref so callers can pass an inline callback without the effect
 * re-firing (and stealing focus) on every parent re-render — e.g. each
 * keystroke in a controlled input.
 */
export function useDialogFocus({
  open,
  containerRef,
  triggerRef,
  onClose,
}: UseDialogFocusOptions) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open || !containerRef.current) return

    const container = containerRef.current
    const previousFocus = document.activeElement as HTMLElement | null
    const trigger = triggerRef.current

    const focusable = listFocusable(container)
    // Prefer a text field when present (chat composer); otherwise first control.
    const initial =
      focusable.find(
        (el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA',
      ) ?? focusable[0]
    initial?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current?.()
        return
      }

      if (event.key !== 'Tab') return

      // Re-query so controls that appear later (e.g. escalate) stay in the trap.
      const items = listFocusable(container)
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (trigger) {
        trigger.focus()
      } else {
        previousFocus?.focus()
      }
    }
    // Intentionally omit onClose — latest value is always read via onCloseRef.
  }, [open, containerRef, triggerRef])
}
