import type { TicketPriority, TicketStatus } from './types';

// Non-component helpers for ticket display. Kept separate from ui.tsx
// (components) so React Fast Refresh doesn't warn about mixed exports.

export function statusLabel(status: TicketStatus): string {
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'OPEN') return 'Open';
  if (status === 'RESOLVED') return 'Resolved';
  return 'Closed';
}

export function statusTextColor(status: TicketStatus): string {
  if (status === 'OPEN') return 'text-[#ad3e3e]';
  if (status === 'IN_PROGRESS') return 'text-[#e4b600]';
  if (status === 'RESOLVED') return 'text-[#3a6133]';
  return 'text-[#525252]';
}

export function priorityTextColor(priority: TicketPriority): string {
  if (priority === 'HIGH') return 'text-[#ad3e3e]';
  if (priority === 'MEDIUM') return 'text-[#e4b600]';
  return 'text-[#3a6133]';
}

export function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 0)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
