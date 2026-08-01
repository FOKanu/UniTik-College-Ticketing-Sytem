# University (mdh) brand palette — Figma + frontend

Aligned to the Studierendenportal look (steel/sky blues, medium gray nav, dark text, white ground).

Source reference: mdh University of Applied Sciences student portal.
Figma file: [College Ticketing System - Wireframes](https://www.figma.com/design/eMdAoJ0lMeFkwPk8TAZviQ/College-Ticketing-System---Wireframes?node-id=85-4)

## Color tokens

| Token | Role | Hex |
| --- | --- | --- |
| `color.brand.steel` | Primary buttons / CTAs | `#2574A9` |
| `color.brand.sky` | Links | `#4FB4EC` |
| `color.brand.cornflower` | Arrows / callouts / instructional accents | `#5B9BD5` |
| `color.neutral.nav` | Nav bar background | `#8D8D8D` |
| `color.neutral.text` | Body / headings | `#333333` |
| `color.neutral.bg` | Page background | `#FFFFFF` |
| `color.neutral.muted` | Borders / dividers / secondary chrome | `#D1D5DB` (supporting; not from portal primary list) |

## Login wireframe mapping (TicketHub / node ~85:4)

| Element | Apply |
| --- | --- |
| Page background | `#FFFFFF` (replace lavender gradient) |
| Card surface | `#FFFFFF` + subtle border `#D1D5DB` |
| Title / labels | `#333333` |
| Input fill | `#FFFFFF` or very light gray; border `#8D8D8D` |
| “Forgot password?” / “Sign Up” links | `#4FB4EC` |
| Primary **Sign In** button | fill `#2574A9`, text `#FFFFFF` |
| SSO secondary button | white fill, border `#8D8D8D`, text `#333333` |
| “or” divider | line `#8D8D8D` |

## App shell mapping (student/staff layouts)

| Element | Apply |
| --- | --- |
| Top / side nav | `#8D8D8D`, nav labels white |
| Active nav item | slightly lighter gray or `#2574A9` underline |
| Primary buttons | `#2574A9` |
| Text links | `#4FB4EC` |
| Body text | `#333333` |
| Page background | `#FFFFFF` |
| Help callouts / arrows | `#5B9BD5` |

## Figma Variables (create once, reuse everywhere)

In Figma: **Local variables** → collection `mdh / UTS`:

1. Create COLOR variables with the hex values above.
2. Bind Login + AppShell layers to variables (not hard-coded paints).
3. Optional: document a **Styles** set (`Button/Primary`, `Link/Default`, `Nav/Bar`) pointing at the same variables.

## Applied in Figma (2026-07-24)

File: `eMdAoJ0lMeFkwPk8TAZviQ` — collection **`mdh / UTS`** with the six color variables above.

Updated frames:
- `00 - Sign In` / `00b - Sign Up` — white ground, steel primary CTA, sky links, nav gray chrome
- Student + staff app shells (`01`–`11`) — nav header `#8D8D8D`, steel accents (active nav / stats / CTAs), cornflower chips, dark text `#333333`

Open Variables in Figma to tweak tokens globally.
