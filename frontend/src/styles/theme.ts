/**
 * Theme tokens live in `src/index.css` (`:root` CSS variables).
 * Import this module when you need typed token names in JS/TS.
 */
export const theme = {
  colors: {
    primary: 'var(--color-primary)',
    surface: 'var(--color-surface)',
    text: 'var(--color-text)',
  },
  radius: {
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    pill: 'var(--radius-pill)',
  },
} as const
