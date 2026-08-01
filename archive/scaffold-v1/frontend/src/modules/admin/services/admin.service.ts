// All calls to the backend admin module go through this file — components never call
// apiClient directly.

import { apiClient } from '../../../services/api-client';
import { AdminItem } from '../types/admin.types';

export const adminService = {
  list: () => apiClient.get<AdminItem[]>('/admin'),
  getById: (id: string) => apiClient.get<AdminItem>(`/admin/${id}`),
};
