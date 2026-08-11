import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import {
  applyDocumentTheme,
  startThemeMediaListener,
  useThemeStore,
} from './stores/themeStore'
import './index.css'

function ThemeBootstrap({ children }: { children: React.ReactNode }) {
  const preference = useThemeStore((s) => s.preference)

  useEffect(() => {
    applyDocumentTheme(preference)
  }, [preference])

  useEffect(() => startThemeMediaListener(), [])

  return children
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeBootstrap>
      <App />
    </ThemeBootstrap>
  </StrictMode>,
)
