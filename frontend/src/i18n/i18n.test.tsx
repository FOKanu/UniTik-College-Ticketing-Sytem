import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import i18n, { LANGUAGE_STORAGE_KEY } from './index'

describe('application language', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
    localStorage.clear()
  })

  it('synchronizes selectors, persistence, and the html lang attribute', async () => {
    render(<><LanguageSelector /><LanguageSelector /></>)
    const triggers = screen.getAllByRole('button', { name: /EN/i })
    fireEvent.click(triggers[0])
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Deutsch/i }))

    await waitFor(() => expect(i18n.resolvedLanguage).toBe('de'))
    expect(document.documentElement.lang).toBe('de')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('de')
    expect(screen.getAllByRole('button', { name: /DE/i })).toHaveLength(2)
  })
})
