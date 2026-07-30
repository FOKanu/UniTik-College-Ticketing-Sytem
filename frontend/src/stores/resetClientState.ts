import { useNotificationStore } from './notificationStore'
import { useTicketStore } from './ticketStore'
import { useUiStore } from './uiStore'

/** Clear client caches on logout / expired session (auth cleared separately). */
export function resetClientState() {
  useTicketStore.getState().reset()
  useNotificationStore.getState().reset()
  useUiStore.getState().reset()
}
