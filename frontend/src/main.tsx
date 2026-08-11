import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeBootstrap } from '@/components/layout/ThemeBootstrap'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeBootstrap>
      <App />
    </ThemeBootstrap>
  </StrictMode>,
)
