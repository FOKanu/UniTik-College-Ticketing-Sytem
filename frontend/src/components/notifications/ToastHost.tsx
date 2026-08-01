import { useEffect } from 'react'
import { useUiStore, type ToastMessage } from '@/stores/uiStore'
import styles from './ToastHost.module.css'

const AUTO_DISMISS_MS = 5000

function ToastItem({ toast }: { toast: ToastMessage }) {
  const dismissToast = useUiStore((s) => s.dismissToast)

  useEffect(() => {
    const timer = window.setTimeout(
      () => dismissToast(toast.id),
      AUTO_DISMISS_MS,
    )
    return () => window.clearTimeout(timer)
  }, [dismissToast, toast.id])

  const tone = toast.tone ?? 'info'

  return (
    <div
      className={`${styles.toast} ${styles[tone]}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.content}>
        <strong>{toast.title}</strong>
        {toast.body ? <p>{toast.body}</p> : null}
      </div>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => dismissToast(toast.id)}
        aria-label={`Dismiss ${toast.title}`}
      >
        ×
      </button>
    </div>
  )
}

export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts)

  if (!toasts.length) return null

  return (
    <div className={styles.host} aria-label="Toast notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
