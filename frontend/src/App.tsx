import { AppRouter } from '@/app/AppRouter'
import { ErrorBoundary } from '@/components/errors'

export default function App() {
  return (
    <ErrorBoundary
      onError={(error) => {
        if (import.meta.env.DEV) {
          console.error('Unhandled app error:', error)
        }
      }}
    >
      <AppRouter />
    </ErrorBoundary>
  )
}
