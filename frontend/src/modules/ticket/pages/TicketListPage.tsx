import { TicketList } from '../components/TicketList';

// Ticket list/detail — the student/staff-facing ticket portal.
// Requirement(s) covered: NFR-1.2.1 (ticket report), NFR-1.1.2/1.1.3 (creation/correction)
export function TicketListPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">Ticket</h1>
      <TicketList />
    </div>
  );
}
