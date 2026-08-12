export interface Conversation {
  matchId: string;
  factoryId?: string | null;
  factoryName: string;
  cropName: string | null;
  status?: string | null;
  matchCreatedAt?: string | null;
  quantityTons?: number | null;
  pricePerTon?: number | null;
  deliveryDate?: string | null;
  contractId?: string | null;
  contractFullySigned?: boolean;
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
