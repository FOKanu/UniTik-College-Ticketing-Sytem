// All calls to the backend knowledge-base module go through this file — components never call
// apiClient directly.

import { apiClient } from '../../../services/api-client';
import { FaqItem } from '../types/faq.types';

export const faqService = {
  list: () => apiClient.get<FaqItem[]>('/knowledge-base'),
  getById: (id: string) => apiClient.get<FaqItem>(`/knowledge-base/${id}`),
};
