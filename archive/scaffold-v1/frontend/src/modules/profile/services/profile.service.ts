// All calls to the backend users module go through this file — components never call
// apiClient directly.

import { apiClient } from '../../../services/api-client';
import { ProfileItem } from '../types/profile.types';

export const profileService = {
  list: () => apiClient.get<ProfileItem[]>('/users'),
  getById: (id: string) => apiClient.get<ProfileItem>(`/users/${id}`),
};
