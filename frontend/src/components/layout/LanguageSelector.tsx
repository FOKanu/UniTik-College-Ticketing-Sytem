import { useEffect, useId, useRef, useState } from 'react'
import { IconCheck, IconChevronDown, IconGlobe } from '@/components/ui/icons'
import styles from './LanguageSelector.module.css'

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
] as const

export function LanguageSelector({
  compact = false,
  menuNote,
}: {
  compact?: boolean
  menuNote?: string
}) {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<(typeof LANGUAGES)[number]>(LANGUAGES[0])
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

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

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <IconGlobe width={18} height={18} />
        {!compact ? <span>{lang.short}</span> : null}
        <IconChevronDown width={16} height={16} />
      </button>
      {open ? (
        <div id={menuId} className={styles.menu} role="menu" aria-label="Language">
          <p className={styles.menuLabel}>Language</p>
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              role="menuitemradio"
              aria-checked={lang.code === item.code}
              className={
                lang.code === item.code ? styles.menuItemActive : styles.menuItem
              }
              onClick={() => {
                setLang(item)
                setOpen(false)
              }}
            >
              <span>
                {item.label} <em>({item.short})</em>
              </span>
              {lang.code === item.code ? (
                <IconCheck width={16} height={16} />
              ) : null}
            </button>
          ))}
          {menuNote ? <p className={styles.menuNote}>{menuNote}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
