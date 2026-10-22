export type SupportSenderType = 'customer' | 'ai' | 'human' | 'system';
export type SupportConversationStatus = 'open' | 'awaiting_human' | 'human_handling' | 'resolved';
export type SupportHandlingMode = 'ai' | 'human';
export type SupportPriority = 'normal' | 'high' | 'urgent';

export interface SupportMessage {
  id: string;
  conversationId: string;
  sender: SupportSenderType;
  authorName: string;
  text: string;
  createdAt: string;
  isInternalNote?: boolean;
}

export interface SupportCustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  isGuest: boolean;
  visitorLocation?: {
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    flag?: string;
  };
}

export interface InternalStaffNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface SupportConversation {
  id: string;
  sessionToken: string;
  customer: SupportCustomerInfo;
  status: SupportConversationStatus;
  handlingMode: SupportHandlingMode;
  priority: SupportPriority;
  escalationReason?: string;
  escalatedAt?: string;
  assignedAgent?: string;
  unreadByAdmin: boolean;
  unreadByCustomer: boolean;
  messages: SupportMessage[];
  internalNotes: InternalStaffNote[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportStatsSummary {
  total: number;
  awaitingHuman: number;
  activeHuman: number;
  aiHandled: number;
  resolved: number;
  unreadCount: number;
}
