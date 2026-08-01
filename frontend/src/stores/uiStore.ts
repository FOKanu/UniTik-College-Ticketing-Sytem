import { create } from 'zustand'

export interface ToastMessage {
  id: string
  title: string
  body?: string
  tone?: 'info' | 'success' | 'error'
}

interface UiState {
  toasts: ToastMessage[]
  pushToast: (toast: Omit<ToastMessage, 'id'> & { id?: string }) => void
  dismissToast: (id: string) => void
  reset: () => void
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],

  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: toast.id ?? `toast-${Date.now()}`,
          title: toast.title,
          body: toast.body,
          tone: toast.tone ?? 'info',
        },
      ],
    })),

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  reset: () => set({ toasts: [] }),
}))
