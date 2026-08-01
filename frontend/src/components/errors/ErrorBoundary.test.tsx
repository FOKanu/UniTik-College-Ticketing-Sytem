import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function ThrowAlways(): never {
  throw new Error('Boom')
}

describe('ErrorBoundary', () => {
  it('renders fallback UI when a child throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary
        fallback={({ error }) => (
          <div role="alert">
            <h1>Something went wrong</h1>
            <p>{error.message}</p>
          </div>
        )}
      >
        <ThrowAlways />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Boom')).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('invokes reset when try again is clicked', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let resetCount = 0

    render(
      <ErrorBoundary
        fallback={({ error, reset }) => (
          <div role="alert">
            <p>{error.message}</p>
            <button
              type="button"
              onClick={() => {
                resetCount += 1
                reset()
              }}
            >
              Try again
            </button>
          </div>
        )}
      >
        <ThrowAlways />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(resetCount).toBe(1)

    consoleError.mockRestore()
  })
})
