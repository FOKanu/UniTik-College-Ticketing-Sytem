// All calls to the backend dashboard module go through this file — components never call
// apiClient directly.

import { apiClient } from '../../../services/api-client';
import { DashboardItem } from '../types/dashboard.types';

export const dashboardService = {
  list: () => apiClient.get<DashboardItem[]>('/dashboard'),
  getById: (id: string) => apiClient.get<DashboardItem>(`/dashboard/${id}`),
};
