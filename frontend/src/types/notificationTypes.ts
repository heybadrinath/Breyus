export type NotificationType =
    | 'trade_created'
    | 'counter_offer'
    | 'trade_accepted'
    | 'trade_rejected'
    | 'document_uploaded'
    | 'documents_invalidated'
    | 'phase_advanced'
    | 'trade_completed'
    | 'trade_cancelled'
    | 'new_message'
    | 'analysis_completed';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationMetadata {
    productName?: string;
    productId?: string;
    counterpartyName?: string;
    counterpartyId?: string;
    documentType?: string;
    newPhase?: string;
    newPrice?: string;
    reason?: string;
    senderName?: string;
    conversationId?: string;
    totalAmount?: string;
    [key: string]: any;
}

export interface Notification {
    _id: string;
    userId: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    read: boolean;
    tradeId?: string;
    conversationId?: string;
    actionUrl?: string;
    metadata?: NotificationMetadata;
    createdAt: string; // Date string from JSON
    updatedAt: string; // Date string from JSON
}

export interface NotificationQuery {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
    category?: 'trade' | 'message' | 'system';
}

export interface PaginatedNotifications {
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface UnreadCountResponse {
    count: number;
}
