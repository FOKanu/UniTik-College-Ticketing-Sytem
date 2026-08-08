import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        useTicketStore.getState().error ?? t('tickets.uploadFailedGeneric'),
      )
    }
  }

  async function handleDownload(attachment: TicketAttachment) {
    setLocalError(null)
    try {
      await ticketsApi.downloadAttachment(ticketId, attachment)
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : t('tickets.downloadFailed'),
      )
    }
  }

  async function handleDelete(attachmentId: string) {
    setLocalError(null)
    const ok = await deleteAttachment(ticketId, attachmentId)
    if (!ok) {
      setLocalError(
        useTicketStore.getState().error ?? t('tickets.removeFailed'),
      )
    }
  }

  return (
    <div className={styles.panel}>
      <h2>{t('tickets.attachments')}</h2>

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
                  aria-label={t('tickets.removeFile', { name: file.name })}
                >
                  {t('tickets.remove')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{t('tickets.noAttachments')}</p>
      )}

      {canUpload ? (
        <FileDropzone
          id={dropzoneId}
          fileName={uploadingName}
          busy={!!uploadingName}
          busyLabel={t('tickets.uploading', { name: uploadingName })}
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
