import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import { de } from '@/locales/de/translation'
import { en } from '@/locales/en/translation'
import i18n, { LANGUAGE_STORAGE_KEY } from './index'

function getObjectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.keys(obj).reduce((acc: string[], key: string) => {
    const pre = prefix.length ? `${prefix}.` : ''
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      acc.push(...getObjectKeys(obj[key] as Record<string, unknown>, pre + key))
    } else {
      acc.push(pre + key)
    }
    return acc
  }, [])
}

function getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

describe('application language & i18n German localization', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
    localStorage.clear()
  })

  it('synchronizes selectors, persistence, and the html lang attribute', async () => {
    render(
      <>
        <LanguageSelector />
        <LanguageSelector />
      </>,
    )
    const triggers = screen.getAllByRole('button', { name: /EN/i })
    fireEvent.click(triggers[0])
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Deutsch/i }))

    await waitFor(() => expect(i18n.resolvedLanguage).toBe('de'))
    expect(document.documentElement.lang).toBe('de')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('de')
    expect(screen.getAllByRole('button', { name: /DE/i })).toHaveLength(2)
  })

  it('ensures every English translation key exists in German translations with non-empty content', () => {
    const enKeys = getObjectKeys(en as Record<string, unknown>)
    const deKeys = getObjectKeys(de as Record<string, unknown>)

    expect(deKeys).toEqual(expect.arrayContaining(enKeys))

    for (const key of enKeys) {
      const enVal = getNestedValue(en as Record<string, unknown>, key)
      const deVal = getNestedValue(de as Record<string, unknown>, key)

      expect(deVal, `Missing German key: ${key}`).toBeDefined()
      expect(typeof deVal).toBe('string')
      expect((deVal as string).trim().length, `Empty German string for key: ${key}`).toBeGreaterThan(0)

      // Verify interpolation placeholders {{var}} match between EN and DE
      const enVars = (typeof enVal === 'string' ? enVal.match(/\{\{\w+\}\}/g) : null) ?? []
      const deVars = (typeof deVal === 'string' ? deVal.match(/\{\{\w+\}\}/g) : null) ?? []
      expect(deVars.sort(), `Interpolation variable mismatch in key: ${key}`).toEqual(enVars.sort())
    }
  })

  it('renders German umlauts (ä, ö, ü, ß) cleanly without encoding errors', async () => {
    await i18n.changeLanguage('de')

    expect(i18n.t('common.close')).toBe('Schließen')
    expect(i18n.t('common.save')).toBe('Änderungen speichern')
    expect(i18n.t('nav.openMenu')).toBe('Menü öffnen')
    expect(i18n.t('nav.dashboard')).toBe('Übersicht')
    expect(i18n.t('departments.registrar')).toBe('Studierendenverwaltung')

    // Confirm no unicode replacement characters (\uFFFD)
    expect(i18n.t('common.close')).not.toContain('\uFFFD')
    expect(i18n.t('nav.dashboard')).not.toContain('\uFFFD')
  })

  it('handles interpolation and pluralization correctly in German', async () => {
    await i18n.changeLanguage('de')

    // Interpolation
    expect(i18n.t('dashboard.welcome', { name: 'Alex' })).toBe('Willkommen zurück, Alex')
    expect(i18n.t('queue.assignedTo', { name: 'Dr. Mueller' })).toBe('Dr. Mueller zugewiesen')

    // Pluralization (v4 CLDR: count === 1 -> "one" category, everything else -> "other")
    expect(i18n.t('queue.closeTitle', { count: 1 })).toBe('1 Ticket schließen?')
    expect(i18n.t('queue.closeTitle', { count: 0 })).toBe('0 Tickets schließen?')
    expect(i18n.t('queue.closeTitle', { count: 5 })).toBe('5 Tickets schließen?')
    expect(i18n.t('agentDashboard.atRisk', { count: 1 })).toBe('1 Ticket innerhalb von 8 Stunden vor SLA.')
    expect(i18n.t('agentDashboard.atRisk', { count: 3 })).toBe('3 Tickets innerhalb von 8 Stunden vor SLA.')
    expect(i18n.t('queue.bulkSuccess', { action: 'Closed', count: 1 })).toBe('Closed: 1 Ticket.')
    expect(i18n.t('queue.bulkSuccess', { action: 'Closed', count: 4 })).toBe('Closed: 4 Tickets.')
  })

  it('handles pluralization correctly in English (v4 CLDR format)', async () => {
    await i18n.changeLanguage('en')

    expect(i18n.t('queue.closeTitle', { count: 1 })).toBe('Close 1 ticket?')
    expect(i18n.t('queue.closeTitle', { count: 0 })).toBe('Close 0 tickets?')
    expect(i18n.t('queue.closeTitle', { count: 5 })).toBe('Close 5 tickets?')
    expect(i18n.t('agentDashboard.atRisk', { count: 1 })).toBe('1 ticket within 8 hours of SLA.')
    expect(i18n.t('agentDashboard.atRisk', { count: 2 })).toBe('2 tickets within 8 hours of SLA.')
    expect(i18n.t('queue.bulkSuccess', { action: 'Closed', count: 1 })).toBe('Closed 1 ticket.')
    expect(i18n.t('queue.bulkSuccess', { action: 'Closed', count: 4 })).toBe('Closed 4 tickets.')
  })

  it('falls back to English when a missing key is requested in German', async () => {
    await i18n.changeLanguage('de')
    expect(i18n.t('nonexistent.key.test')).toBe('nonexistent.key.test')
  })
})
