import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { title?: string }

function IconBase({ title, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

export function IconDashboard(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </IconBase>
  )
}

export function IconTicket(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
      <path d="M10 7v10" />
    </IconBase>
  )
}

export function IconChat(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 17.5 4 21l3.5-1.2A8.5 8.5 0 1 0 5 17.5Z" />
    </IconBase>
  )
}

export function IconBook(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
      <path d="M8 7h8M8 11h6" />
    </IconBase>
  )
}

export function IconBell(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3a5 5 0 0 0-5 5v2.2c0 .5-.2 1-.5 1.4L5 15h14l-1.5-3.4a2 2 0 0 1-.5-1.4V8a5 5 0 0 0-5-5Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </IconBase>
  )
}

export function IconUser(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5a7 7 0 0 1 14 0" />
    </IconBase>
  )
}

export function IconUsers(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
      <circle cx="16.5" cy="9" r="2.5" />
      <path d="M15 19a5 5 0 0 1 6.5 0" />
    </IconBase>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </IconBase>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16.5 16.5 4 4" />
    </IconBase>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  )
}

export function IconClose(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </IconBase>
  )
}

export function IconChevronDown(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  )
}

export function IconChevronLeft(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m15 6-6 6 6 6" />
    </IconBase>
  )
}

export function IconSend(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 11.5 20 4l-5.5 16-2.5-6.5L4 11.5Z" />
    </IconBase>
  )
}

export function IconPaperclip(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m15.5 8.5-6.8 6.8a2.5 2.5 0 0 0 3.5 3.5l7.5-7.5a4 4 0 0 0-5.7-5.7L6.5 13.1" />
    </IconBase>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m5 12 4.5 4.5L19 7" />
    </IconBase>
  )
}

export function IconAlert(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4 21 19H3L12 4Z" />
      <path d="M12 10v4M12 16.5v.5" />
    </IconBase>
  )
}

export function IconGlobe(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </IconBase>
  )
}

export function IconMenu(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  )
}

export function IconExternal(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 5H5v14h14v-5M13 5h6v6M11 13 19 5" />
    </IconBase>
  )
}

export function IconBuilding(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 20h16M6 20V6l6-2 6 2v14M10 9h.01M14 9h.01M10 13h.01M14 13h.01M10 17h.01M14 17h.01" />
    </IconBase>
  )
}

export function IconChart(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 19h16M7 16v-5M12 16V8M17 16v-8" />
    </IconBase>
  )
}

export function IconClock(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </IconBase>
  )
}

export function IconLogout(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" />
    </IconBase>
  )
}

export function IconFilter(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16l-5.5 7v5l-5 2v-7L4 6Z" />
    </IconBase>
  )
}
