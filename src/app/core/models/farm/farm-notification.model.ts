export interface FarmNotification {
  notificationId: string;
  title: string;
  message: string;
  type: string | null;
  isRead: boolean;
  createdAt: string;
}
