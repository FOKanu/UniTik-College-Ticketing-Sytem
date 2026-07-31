export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string; // ISO timestamp
  ticketId?: string;
}
