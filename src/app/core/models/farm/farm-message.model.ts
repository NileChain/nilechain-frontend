export interface Conversation {
  matchId: string;
  factoryName: string;
  cropName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface Message {
  messageId: string;
  matchId: string;
  senderId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
}
