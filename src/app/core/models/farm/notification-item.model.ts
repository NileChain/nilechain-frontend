export interface NotificationItem {
  notificationId: string;
  title: string;
  message: string;
  type: string | null;
  isRead: boolean;
  createdAt: string;
}
