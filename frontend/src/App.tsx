import { useEffect } from 'react'
import { AppRouter } from '@/app/AppRouter'
import { ErrorBoundary } from '@/components/errors'
import { applyInstitutionTheme } from '@/lib/theme/applyInstitutionTheme'
import { useInstitutionStore } from '@/stores/institutionStore'

export default function App() {
  const institutionColor = useInstitutionStore((s) => s.institution.color)

  useEffect(() => {
    applyInstitutionTheme(institutionColor)
  }, [institutionColor])

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
