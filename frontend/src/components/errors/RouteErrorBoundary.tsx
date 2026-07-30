import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'

interface RouteErrorBoundaryProps {
  children: ReactNode
  compact?: boolean
}

export function RouteErrorBoundary({
  children,
  compact = false,
}: RouteErrorBoundaryProps) {
  const location = useLocation()

  return (
    <ErrorBoundary resetKey={location.pathname} compact={compact}>
      {children}
    </ErrorBoundary>
  )
}
