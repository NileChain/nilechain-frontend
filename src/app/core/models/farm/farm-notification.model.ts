export interface FarmNotification {
  notificationId: string;
  title: string;
  message: string;
  type: string | null;
  isRead: boolean;
  createdAt: string;
  link?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}
