// All calls to the backend notifications module go through this file — components never call
// apiClient directly.

import { apiClient } from '../../../services/api-client';
import { NotificationsItem } from '../types/notifications.types';

export const notificationsService = {
  list: () => apiClient.get<NotificationsItem[]>('/notifications'),
  getById: (id: string) => apiClient.get<NotificationsItem>(`/notifications/${id}`),
};
