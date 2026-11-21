import { useEffect, type ReactNode } from 'react'
import {
  applyDocumentTheme,
  startThemeMediaListener,
  useThemeStore,
} from '@/stores/themeStore'

/** Applies persisted theme preference and listens for OS scheme changes. */
export function ThemeBootstrap({ children }: { children: ReactNode }) {
  const preference = useThemeStore((s) => s.preference)

  useEffect(() => {
    applyDocumentTheme(preference)
  }, [preference])

  useEffect(() => startThemeMediaListener(), [])

  return children
}
