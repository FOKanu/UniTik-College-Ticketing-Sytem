import { useState } from 'react'
import { FileDropzone } from '@/components/ui'
import { IconPaperclip } from '@/components/ui/icons'
import { ticketsApi } from '@/lib/api'
import { useTicketStore } from '@/stores'
import type { TicketAttachment } from '@/types'
import styles from './TicketAttachments.module.css'

interface TicketAttachmentsProps {
  ticketId: string
  attachments?: TicketAttachment[]
  /** When false, hide the upload dropzone (read-only list). */
  canUpload?: boolean
  dropzoneId?: string
}

export function TicketAttachments({
  ticketId,
  attachments = [],
  canUpload = true,
  dropzoneId = 'ticket-attachment-upload',
}: TicketAttachmentsProps) {
  const mutating = useTicketStore((s) => s.mutating)
  const error = useTicketStore((s) => s.error)
  const uploadAttachment = useTicketStore((s) => s.uploadAttachment)
  const deleteAttachment = useTicketStore((s) => s.deleteAttachment)
  const [localError, setLocalError] = useState<string | null>(null)
  const [uploadingName, setUploadingName] = useState<string | null>(null)

  async function handleUpload(file: File | null) {
    if (!file) return
    setLocalError(null)
    setUploadingName(file.name)
    const uploaded = await uploadAttachment(ticketId, file)
    setUploadingName(null)
    if (!uploaded) {
      setLocalError(
        useTicketStore.getState().error ?? 'Failed to upload attachment.',
      )
    }
  }

  async function handleDownload(attachment: TicketAttachment) {
    setLocalError(null)
    try {
      await ticketsApi.downloadAttachment(ticketId, attachment)
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Failed to download attachment.',
      )
    }
  }

  async function handleDelete(attachmentId: string) {
    setLocalError(null)
    const ok = await deleteAttachment(ticketId, attachmentId)
    if (!ok) {
      setLocalError(
        useTicketStore.getState().error ?? 'Failed to remove attachment.',
      )
    }
  }

  return (
    <div className={styles.panel}>
      <h2>Attachments</h2>

      {attachments.length > 0 ? (
        <ul className={styles.list}>
          {attachments.map((file) => (
            <li key={file.id}>
              <button
                type="button"
                className={styles.fileLink}
                onClick={() => void handleDownload(file)}
              >
                <IconPaperclip width={14} height={14} />
                <span>{file.name}</span>
                {file.sizeLabel ? (
                  <small>{file.sizeLabel}</small>
                ) : null}
              </button>
              {canUpload ? (
                <button
                  type="button"
                  className={styles.remove}
                  disabled={mutating}
                  onClick={() => void handleDelete(file.id)}
                  aria-label={`Remove ${file.name}`}
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No files attached yet.</p>
      )}

      {canUpload ? (
        <FileDropzone
          id={dropzoneId}
          fileName={uploadingName}
          busy={!!uploadingName}
          busyLabel={`Uploading ${uploadingName}…`}
          disabled={mutating && !uploadingName}
          onChange={(file) => void handleUpload(file)}
        />
      ) : null}

      {localError || error ? (
        <p className={styles.error} role="alert">
          {localError ?? error}
        </p>
      ) : null}
    </div>
  )
}
