export function formatNotificationTime(iso: string, locale = 'en-US'): string {
  const date = new Date(iso)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)

  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffMinutes < 1) return relative.format(0, 'minute')
  if (diffMinutes < 60) return relative.format(-diffMinutes, 'minute')

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return relative.format(-diffHours, 'hour')

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return relative.format(-diffDays, 'day')

  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
}
