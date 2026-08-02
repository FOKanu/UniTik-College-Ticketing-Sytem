export {
  apiBaseUrl,
  apiClient,
  apiRequest,
  del,
  get,
  getDataSourceMode,
  isMockDataSource,
  mockLatency,
  patch,
  post,
  put,
  usesLiveAuth,
  usesLiveChat,
  usesLiveTickets,
  usesMockKnowledge,
  usesMockNotifications,
  type DataSourceMode,
} from './client'
export { ApiError, isApiError, toApiError, type ApiErrorCode } from './errors'
export { authApi, signOut } from './auth'
export { ticketsApi } from './tickets'
export { notificationsApi } from './notifications'
export { knowledgeApi } from './knowledge'
export type {
  ChatConversation,
  ChatMessage,
  ChatMode,
  EscalatedTicket,
  EscalateResult,
  LlmHealth,
  StreamHandlers,
} from './chat'
export { chatApi } from './chat'
export type * from './types'
