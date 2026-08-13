import { useEffect } from 'react'
import { AppRouter } from '@/app/AppRouter'
import { ErrorBoundary } from '@/components/errors'
import { findInstitution } from '@/lib/institutions'
import { applyInstitutionTheme } from '@/lib/theme/applyInstitutionTheme'
import { useInstitutionStore } from '@/stores/institutionStore'

export default function App() {
  const institutionId = useInstitutionStore((s) => s.institutionId)
  const institutionColor = findInstitution(institutionId).color

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
