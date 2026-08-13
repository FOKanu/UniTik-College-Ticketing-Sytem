// All calls to the backend tickets module go through this file — components never call
// apiClient directly.

import { apiClient } from '../../../services/api-client';
import { TicketItem } from '../types/ticket.types';

export const ticketService = {
  list: () => apiClient.get<TicketItem[]>('/tickets'),
  getById: (id: string) => apiClient.get<TicketItem>(`/tickets/${id}`),
};
