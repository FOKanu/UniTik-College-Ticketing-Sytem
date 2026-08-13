import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useDialogFocus } from './useDialogFocus'

function Harness({
  open,
  onClose,
  onDraftChange,
}: {
  open: boolean
  onClose: () => void
  onDraftChange?: (value: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useDialogFocus({ open, containerRef, triggerRef, onClose })

  return (
    <div>
      <button ref={triggerRef} type="button">
        Trigger
      </button>
      {open ? (
        <div ref={containerRef} role="dialog">
          <button type="button">Open full assistant</button>
          <button type="button">Close</button>
          <input
            aria-label="Ask a question"
            onChange={(e) => onDraftChange?.(e.target.value)}
          />
          <a href="/assistant">Open full chat</a>
        </div>
      ) : null}
    </div>
  )
}

afterEach(() => {
  cleanup()
})

describe('useDialogFocus', () => {
  it('focuses the text input when a dialog opens, not the first button', () => {
    render(<Harness open onClose={() => undefined} />)
    expect(screen.getByLabelText('Ask a question')).toHaveFocus()
  })

  it('keeps input focus while the parent re-renders from typing', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    const { rerender } = render(
      <Harness open onClose={onClose} onDraftChange={() => undefined} />,
    )

    const input = screen.getByLabelText('Ask a question')
    await user.click(input)
    await user.type(input, 'hi')

    // Simulate ChatbotFab: a fresh onClose identity after each keystroke.
    rerender(
      <Harness open onClose={() => onClose()} onDraftChange={() => undefined} />,
    )
    rerender(
      <Harness open onClose={() => onClose()} onDraftChange={() => undefined} />,
    )

    expect(screen.getByLabelText('Ask a question')).toHaveFocus()
  })

  it('still closes on Escape via the latest onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness open onClose={onClose} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
