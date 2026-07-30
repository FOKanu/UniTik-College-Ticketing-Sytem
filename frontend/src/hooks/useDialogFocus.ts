import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

interface UseDialogFocusOptions {
  open: boolean
  containerRef: RefObject<HTMLElement | null>
  triggerRef: RefObject<HTMLElement | null>
  onClose?: () => void
}

export function useDialogFocus({
  open,
  containerRef,
  triggerRef,
  onClose,
}: UseDialogFocusOptions) {
  useEffect(() => {
    if (!open || !containerRef.current) return

    const container = containerRef.current
    const previousFocus = document.activeElement as HTMLElement | null

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((node) => !node.hasAttribute('disabled'))

    focusable[0]?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose?.()
        return
      }

      if (event.key !== 'Tab' || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

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
      if (triggerRef.current) {
        triggerRef.current.focus()
      } else {
        previousFocus?.focus()
      }
    }
  }, [open, containerRef, triggerRef, onClose])
}
