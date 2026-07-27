export interface ConversationItem {
  matchId: string;
  factoryName: string;
  cropName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}
