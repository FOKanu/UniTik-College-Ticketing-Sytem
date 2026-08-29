import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IconCheck,
  IconChevronDown,
  IconMonitor,
  IconMoon,
  IconSun,
} from '@/components/ui/icons'
import {
  useThemeStore,
  type ThemePreference,
} from '@/stores/themeStore'
import styles from './LanguageSelector.module.css'

const THEMES: {
  code: ThemePreference
  labelKey: string
  shortKey: string
  Icon: typeof IconSun
}[] = [
  {
    code: 'light',
    labelKey: 'theme.light',
    shortKey: 'theme.lightShort',
    Icon: IconSun,
  },
  {
    code: 'dark',
    labelKey: 'theme.dark',
    shortKey: 'theme.darkShort',
    Icon: IconMoon,
  },
  {
    code: 'system',
    labelKey: 'theme.system',
    shortKey: 'theme.systemShort',
    Icon: IconMonitor,
  },
]

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const preference = useThemeStore((s) => s.preference)
  const resolved = useThemeStore((s) => s.resolved)
  const setPreference = useThemeStore((s) => s.setPreference)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const active = THEMES.find((item) => item.code === preference) ?? THEMES[2]
  const TriggerIcon =
    preference === 'system'
      ? resolved === 'dark'
        ? IconMoon
        : IconSun
      : active.Icon

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function choose(code: ThemePreference) {
    setPreference(code)
    setOpen(false)
  }

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('theme.label')}
        onClick={() => setOpen((v) => !v)}
      >
        <TriggerIcon width={18} height={18} />
        {!compact ? <span>{t(active.shortKey)}</span> : null}
        <IconChevronDown width={16} height={16} />
      </button>
      {open ? (
        <div
          id={menuId}
          className={styles.menu}
          role="menu"
          aria-label={t('theme.label')}
        >
          <p className={styles.menuLabel}>{t('theme.label')}</p>
          {THEMES.map((item) => (
            <button
              key={item.code}
              type="button"
              role="menuitemradio"
              aria-checked={preference === item.code}
              className={
                preference === item.code
                  ? styles.menuItemActive
                  : styles.menuItem
              }
              onClick={() => choose(item.code)}
            >
              <span>
                <item.Icon
                  width={16}
                  height={16}
                  style={{ marginRight: 8, verticalAlign: -3 }}
                />
                {t(item.labelKey)}
              </span>
              {preference === item.code ? (
                <IconCheck width={16} height={16} />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
