/**
 * All primary/interactive colors in the app read from the --brand-50..900
 * CSS custom properties (see src/index.css). --color-primary and friends
 * are themselves defined as `var(--brand-600)`, so overriding just the
 * --brand-* ramp on :root is enough to re-theme the whole app for a given
 * institution, without touching any component styles.
 */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const num = parseInt(full, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Mix `hex` towards white (ratio > 0) or black (ratio < 0). ratio in [-1, 1]. */
function mix(hex: string, ratio: number): string {
  const [r, g, b] = hexToRgb(hex)
  const target = ratio >= 0 ? 255 : 0
  const amount = Math.abs(ratio)
  return rgbToHex(
    r + (target - r) * amount,
    g + (target - g) * amount,
    b + (target - b) * amount,
  )
}

// Tint/shade steps relative to the base color, which anchors --brand-600.
const RAMP_STEPS: Record<string, number> = {
  '50': 0.92,
  '100': 0.8,
  '200': 0.6,
  '300': 0.4,
  '400': 0.2,
  '500': 0.1,
  '600': 0,
  '700': -0.15,
  '800': -0.3,
  '900': -0.45,
}

export function applyInstitutionTheme(baseColor: string) {
  const root = document.documentElement
  for (const [step, ratio] of Object.entries(RAMP_STEPS)) {
    root.style.setProperty(`--brand-${step}`, mix(baseColor, ratio))
  }
}
