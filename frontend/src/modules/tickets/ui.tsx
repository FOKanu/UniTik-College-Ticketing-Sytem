import { statusLabel, statusTextColor } from './format';
import type { TicketStatus } from './types';

/**
 * Shared chip components for ticket UIs, matching the Figma wireframes
 * (file eMdAoJ0lMeFkwPk8TAZviQ): cornflower-tinted pills with red "Open",
 * amber "In Progress", green "Resolved" text accents.
 *
 * Non-component helpers (colors, labels, relative time) live in format.ts.
 */

export function StatusChip({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#c7c7c7] bg-brand-cornflower/35 px-2.5 py-0.5 text-[11px] font-semibold ${statusTextColor(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function DepartmentChip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#c7c7c7] bg-brand-cornflower/35 px-2.5 py-0.5 text-[11px] font-semibold text-[#525252]">
      {children}
    </span>
  );
}
