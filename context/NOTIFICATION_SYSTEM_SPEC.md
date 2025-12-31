# Breyus Notification System - Complete Technical Specification

**Created:** December 2024
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [Backend Implementation](#4-backend-implementation)
5. [Frontend Implementation](#5-frontend-implementation)
6. [WebSocket Event Flows](#6-websocket-event-flows)
7. [API Reference](#7-api-reference)
8. [Component Specifications](#8-component-specifications)
9. [Business Logic Rules](#9-business-logic-rules)
10. [File Paths Reference](#10-file-paths-reference)
11. [Implementation Checklist](#11-implementation-checklist)

---

## 1. Overview

### 1.1 Purpose
Implement a comprehensive notification system for the Breyus commodity trading platform that:
- Persists notifications to MongoDB for history/retrieval
- Shows real-time toast notifications for all trade and message events
- Displays a notification bell icon with unread badge in the header
- Provides a dropdown showing 5 most recent notifications
- Offers a dedicated notifications page with filters

### 1.2 Key Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Persistence | MongoDB | Consistent with existing stack, allows history |
| Bell dropdown limit | 5 notifications | Per Figma design, keeps UI clean |
| Toast triggers | All trade events | User wants full visibility |
| Inbox scope | Chat only | Clean separation of concerns |
| Retention | 30 days for read | Balance between history and DB size |
| Sound | No sound | Avoid annoyance, visual only |
| Page layout | Simple list + filters | Matches existing UI patterns |

### 1.3 Notification Types

| Type | Trigger | Priority | Recipients |
|------|---------|----------|------------|
| `trade_created` | Buyer submits PR | high | Seller |
| `counter_offer` | Either party counters | high | Other party |
| `trade_accepted` | Either party accepts | high | Other party |
| `trade_rejected` | Either party rejects | normal | Other party |
| `document_uploaded` | Document uploaded | normal | Other party |
| `documents_invalidated` | Earlier doc replaced | urgent | Affected party |
| `phase_advanced` | Trade moves to next phase | normal | Both parties |
| `trade_completed` | Trade finalized | low | Both parties |
| `trade_cancelled` | Trade cancelled | normal | Other party |
| `new_message` | Chat message received | normal | Receiver (if not in inbox) |
| `analysis_completed` | AI market analysis job finished (async) | normal | Requesting user |

---

## 2. System Architecture

### 2.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NOTIFICATION FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

  TRIGGER EVENT (e.g., counter offer submitted)
        │
        ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ TradeNotificationService / InboxGateway                         │
  │                                                                 │
  │  1. Create notification object                                  │
  │  2. Save to MongoDB via NotificationService                     │
  │  3. Get updated unread count                                    │
  │  4. Emit WebSocket event: 'notification-created'                │
  │  5. Send email (if user preference enabled)                     │
  └─────────────────────────────────────────────────────────────────┘
        │
        ▼ (WebSocket)
  ┌─────────────────────────────────────────────────────────────────┐
  │ Frontend - NotificationContext                                  │
  │                                                                 │
  │  1. Receive 'notification-created' event                        │
  │  2. Update unreadCount state                                    │
  │  3. Add notification to recentNotifications array               │
  │  4. Show toast notification (auto-dismiss 5 seconds)            │
  │  5. Update bell badge UI                                        │
  └─────────────────────────────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ User Interactions                                               │
  │                                                                 │
  │  • Click bell → Open dropdown with 5 recent                     │
  │  • Click notification → Navigate to actionUrl + mark as read    │
  │  • Click "See all" → Navigate to /notifications page            │
  │  • Click "Mark all read" → Clear all unread                     │
  └─────────────────────────────────────────────────────────────────┘
```

### 2.2 WebSocket Namespaces

| Namespace | Purpose | Events |
|-----------|---------|--------|
| `/trade` | Trade notifications | `notification-created`, `trade-update`, `negotiation-update`, `document-uploaded` |
| `/inbox` | Chat messaging | `message-received`, `user-typing`, `messages-marked-read`, `notification-created` (for new_message) |

---

## 3. Database Design

### 3.1 Notification Schema

**Collection:** `notifications`

```typescript
interface INotification {
  _id: ObjectId;

  // Recipient
  userId: ObjectId;        // User who receives this notification

  // Classification
  type: NotificationType;  // Enum of notification types
  priority: 'low' | 'normal' | 'high' | 'urgent';

  // Content
  title: string;           // Short title for display
  message: string;         // Detailed message

  // Status
  read: boolean;           // Has user read this?

  // References (for navigation)
  tradeId?: ObjectId;      // Related trade (for trade notifications)
  conversationId?: ObjectId; // Related conversation (for message notifications)

  // Navigation
  actionUrl?: string;      // URL to navigate when clicked

  // Additional data
  metadata?: {
    productName?: string;
    productId?: string;
    counterpartyName?: string;
    counterpartyId?: string;
    documentType?: string;
    newPhase?: string;
    newPrice?: string;
    reason?: string;
    senderName?: string;
    [key: string]: any;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Indexes

```javascript
// Primary query index: Get user's notifications sorted by date
db.notifications.createIndex({ userId: 1, createdAt: -1 });

// Filter by read status
db.notifications.createIndex({ userId: 1, read: 1, createdAt: -1 });

// Cleanup old read notifications (for retention job)
db.notifications.createIndex({ read: 1, createdAt: 1 });

// TTL index for auto-cleanup (optional - can use cron job instead)
// db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000, partialFilterExpression: { read: true } });
```

### 3.3 Retention Policy

- **Read notifications:** Auto-delete after 30 days
- **Unread notifications:** Keep indefinitely until read
- **Implementation:** Scheduled job (cron) runs daily to clean up

```typescript
// Cleanup query
db.notifications.deleteMany({
  read: true,
  createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
});
```

---

## 4. Backend Implementation

### 4.1 Notification Module Structure

```
backend/src/notification/
├── notification.module.ts       # NestJS module definition
├── notification.controller.ts   # REST API endpoints
├── notification.service.ts      # Business logic
├── schema/
│   └── notification.schema.ts   # Mongoose schema
└── dto/
    ├── create-notification.dto.ts
    └── notification-query.dto.ts
```

### 4.2 NotificationService Methods

```typescript
class NotificationService {
  /**
   * Create and persist a new notification
   * @returns The created notification document
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification>;

  /**
   * Get paginated notifications for a user
   * @param userId - User ID
   * @param options - { page, limit, unreadOnly, type }
   * @returns Paginated result with notifications
   */
  async getNotifications(userId: string, options: QueryOptions): Promise<PaginatedResult<Notification>>;

  /**
   * Get N most recent unread notifications (for bell dropdown)
   * @param userId - User ID
   * @param limit - Number to return (default: 5)
   */
  async getRecentUnread(userId: string, limit?: number): Promise<Notification[]>;

  /**
   * Get total unread count for user (for badge)
   */
  async getUnreadCount(userId: string): Promise<number>;

  /**
   * Mark a single notification as read
   * @throws ForbiddenException if notification doesn't belong to user
   */
  async markAsRead(notificationId: string, userId: string): Promise<void>;

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void>;

  /**
   * Delete a single notification
   * @throws ForbiddenException if notification doesn't belong to user
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void>;

  /**
   * Delete all read notifications for user
   */
  async deleteReadNotifications(userId: string): Promise<void>;

  /**
   * Cleanup old read notifications (called by scheduled job)
   * @param daysOld - Delete read notifications older than this many days
   */
  async cleanupOldNotifications(daysOld: number): Promise<number>;
}
```

### 4.3 NotificationController Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Cookie JWT | Paginated list with filters |
| GET | `/notifications/recent` | Cookie JWT | 5 most recent unread |
| GET | `/notifications/unread-count` | Cookie JWT | Count for badge |
| PUT | `/notifications/:id/read` | Cookie JWT | Mark one as read |
| PUT | `/notifications/mark-all-read` | Cookie JWT | Mark all as read |
| DELETE | `/notifications/:id` | Cookie JWT | Delete one |
| DELETE | `/notifications/read` | Cookie JWT | Delete all read |

### 4.4 Modify TradeNotificationService

**File:** `backend/src/trade/trade-notification.service.ts`

**Changes Required:**

1. **Inject NotificationService**
```typescript
constructor(
  private readonly notificationService: NotificationService, // NEW
  private readonly mailService: MailService,
  private readonly tradeGateway: TradeGateway,
) {}
```

2. **Add persistence to each notification method**

Example for `notifyCounterOffer`:

```typescript
async notifyCounterOffer(
  trade: PopulatedTrade,
  counteringParty: 'buyer' | 'seller',
  newPrice: string
): Promise<void> {
  try {
    const recipient = counteringParty === 'buyer' ? trade.seller : trade.buyer;
    const sender = counteringParty === 'buyer' ? trade.buyer : trade.seller;
    const prefs = recipient.notificationPreferences || this.getDefaultPreferences();

    // ====== NEW: PERSIST TO DATABASE ======
    const notification = await this.notificationService.createNotification({
      userId: recipient._id.toString(),
      type: 'counter_offer',
      title: 'New Counter Offer',
      message: `${sender.companyName} sent a counter offer of ${newPrice} for ${trade.product.name}`,
      tradeId: trade._id.toString(),
      priority: 'high',
      actionUrl: `/${recipient.role}/negotiation/${trade._id}`,
      metadata: {
        productName: trade.product.name,
        productId: trade.product._id.toString(),
        counterpartyName: sender.companyName,
        counterpartyId: sender._id.toString(),
        newPrice,
      },
    });

    const unreadCount = await this.notificationService.getUnreadCount(recipient._id.toString());
    // ====== END NEW ======

    // Send real-time WebSocket notification (MODIFIED)
    if (prefs.realtime.counterOffer) {
      // Existing trade-specific event
      this.tradeGateway.emitNegotiationUpdate(trade._id.toString(), {
        type: 'counter_offer',
        trade: trade,
        newPrice,
        counteringParty,
      });

      // NEW: Emit notification-created for bell badge update
      this.tradeGateway.emitNotificationCreated(recipient._id.toString(), {
        notification,
        unreadCount,
      });
    }

    // Send email notification (EXISTING - unchanged)
    if (prefs.email.counterOffer) {
      await this.mailService.sendTradeNotificationEmail(
        recipient.email,
        'Counter Offer Received',
        emailTemplates.counterOfferReceived({
          recipientName: recipient.name,
          productName: trade.product.name,
          senderName: sender.companyName,
          newPrice,
          tradeUrl: `${process.env.FRONTEND_URL}/${recipient.role}/negotiation/${trade._id}`,
        })
      );
    }
  } catch (error) {
    this.logger.error(`Failed to send counter offer notification: ${error.message}`);
  }
}
```

### 4.5 Modify TradeGateway

**File:** `backend/src/trade/trade.gateway.ts`

**Add method:**

```typescript
/**
 * Emit notification event to a specific user
 * Used when a new notification is created
 */
emitNotificationCreated(userId: string, data: {
  notification: Notification;
  unreadCount: number;
}): void {
  this.notifyUser(userId, 'notification-created', data);
}
```

### 4.6 Add Trade Created Notification

**File:** `backend/src/trade/trade.service.ts`

In `createTrade()` method, after saving the trade, notify the seller:

```typescript
async createTrade(dto: CreateTradeDto, buyerId: string): Promise<Trade> {
  // ... existing trade creation logic ...

  const savedTrade = await this.tradeModel.create(trade);

  // NEW: Notify seller of new purchase request
  await this.tradeNotificationService.notifyTradeCreated(
    savedTrade,
    'buyer' // initiating party
  );

  return savedTrade;
}
```

**Add method to TradeNotificationService:**

```typescript
async notifyTradeCreated(
  trade: PopulatedTrade,
  initiatingParty: 'buyer' | 'seller'
): Promise<void> {
  const recipient = trade.seller; // Seller receives PR notification
  const sender = trade.buyer;
  const prefs = recipient.notificationPreferences || this.getDefaultPreferences();

  // Persist notification
  const notification = await this.notificationService.createNotification({
    userId: recipient._id.toString(),
    type: 'trade_created',
    title: 'New Purchase Request',
    message: `${sender.companyName} wants to buy ${trade.product.name}`,
    tradeId: trade._id.toString(),
    priority: 'high',
    actionUrl: `/seller/trade?tab=pr-status`,
    metadata: {
      productName: trade.product.name,
      productId: trade.product._id.toString(),
      buyerName: sender.companyName,
      buyerId: sender._id.toString(),
      offeredPrice: trade.buyerOffer?.price,
      quantity: trade.quantity,
    },
  });

  // ... WebSocket and email logic ...
}
```

### 4.7 Modify InboxGateway for New Message Notifications

**File:** `backend/src/inbox/inbox.gateway.ts`

**Add tracking for active conversation:**

```typescript
// Track which users are currently viewing which conversations
private activeConversations: Map<string, Set<string>> = new Map(); // Map<conversationId, Set<userId>>

@SubscribeMessage('join-conversation')
handleJoinConversation(client: Socket, payload: { conversationId: string; companyId: string }) {
  const { conversationId, companyId } = payload;

  // Join socket room (existing)
  client.join(`conversation-${conversationId}`);

  // Track as active in this conversation (NEW)
  if (!this.activeConversations.has(conversationId)) {
    this.activeConversations.set(conversationId, new Set());
  }
  this.activeConversations.get(conversationId)!.add(companyId);
}

@SubscribeMessage('leave-conversation')
handleLeaveConversation(client: Socket, payload: { conversationId: string; companyId: string }) {
  const { conversationId, companyId } = payload;

  // Leave socket room (existing)
  client.leave(`conversation-${conversationId}`);

  // Remove from active tracking (NEW)
  this.activeConversations.get(conversationId)?.delete(companyId);
}

/**
 * Check if user is currently viewing a conversation
 */
private isUserActiveInConversation(conversationId: string, userId: string): boolean {
  return this.activeConversations.get(conversationId)?.has(userId) ?? false;
}
```

**Modify send-message handler:**

```typescript
@SubscribeMessage('send-message')
async handleSendMessage(
  client: Socket,
  payload: { conversationId: string; companyId: string; text: string }
): Promise<void> {
  const { conversationId, companyId, text } = payload;

  // Save message (existing)
  const message = await this.inboxService.sendMessage(conversationId, companyId, text);
  const conversation = await this.inboxService.getConversationById(conversationId);

  // Determine receiver
  const receiverId = conversation.participants.find(p => p._id.toString() !== companyId)?._id.toString();
  const sender = conversation.participants.find(p => p._id.toString() === companyId);

  // Emit to conversation room (existing)
  this.server.to(`conversation-${conversationId}`).emit('message-received', message);

  // ====== NEW: Create notification if receiver is NOT active in conversation ======
  if (receiverId && !this.isUserActiveInConversation(conversationId, receiverId)) {
    const notification = await this.notificationService.createNotification({
      userId: receiverId,
      type: 'new_message',
      title: 'New Message',
      message: `${sender?.companyName || 'Someone'}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
      conversationId,
      priority: 'normal',
      actionUrl: `/inbox?conversation=${conversationId}`,
      metadata: {
        senderName: sender?.companyName,
        senderId: companyId,
        conversationId,
        messagePreview: text.substring(0, 100),
      },
    });

    const unreadCount = await this.notificationService.getUnreadCount(receiverId);

    // Emit notification event
    this.notifyCompany(receiverId, 'notification-created', {
      notification,
      unreadCount,
    });
  }
}
```

### 4.8 Scheduled Cleanup Job

**Option A: Using @nestjs/schedule**

```typescript
// backend/src/notification/notification.cleanup.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationCleanupService {
  constructor(private readonly notificationService: NotificationService) {}

  // Run daily at 3 AM
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup() {
    const deleted = await this.notificationService.cleanupOldNotifications(30);
    console.log(`Cleaned up ${deleted} old read notifications`);
  }
}
```

---

## 5. Frontend Implementation

### 5.1 Types

**File:** `frontend/src/types/notificationTypes.ts`

```typescript
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
  | 'new_message';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  tradeId?: string;
  conversationId?: string;
  metadata?: {
    productName?: string;
    productId?: string;
    counterpartyName?: string;
    counterpartyId?: string;
    documentType?: string;
    newPhase?: string;
    newPrice?: string;
    reason?: string;
    senderName?: string;
    [key: string]: any;
  };
  priority: NotificationPriority;
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type NotificationFilter = 'all' | 'unread' | 'trades' | 'messages';
```

### 5.2 Notification Service

**File:** `frontend/src/services/notification.service.ts`

```typescript
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Get paginated notifications for current user
 */
export const getNotifications = async (
  page: number = 1,
  limit: number = 20,
  filter: NotificationFilter = 'all'
): Promise<PaginatedNotifications> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filter === 'unread') {
    params.append('unreadOnly', 'true');
  } else if (filter === 'trades') {
    params.append('category', 'trade');
  } else if (filter === 'messages') {
    params.append('type', 'new_message');
  }

  const response = await fetch(`${BACKEND_URL}/notifications?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Get 5 most recent unread notifications (for bell dropdown)
 */
export const getRecentNotifications = async (): Promise<Notification[]> => {
  const response = await fetch(`${BACKEND_URL}/notifications/recent`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recent notifications');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Get total unread count (for badge)
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await fetch(`${BACKEND_URL}/notifications/unread-count`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch unread count');
  }

  const result = await response.json();
  return result.data.count;
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (id: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/notifications/${id}/read`, {
    method: 'PUT',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/notifications/mark-all-read`, {
    method: 'PUT',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to mark all as read');
  }
};

/**
 * Delete a single notification
 */
export const deleteNotification = async (id: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/notifications/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }
};

/**
 * Delete all read notifications
 */
export const deleteReadNotifications = async (): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/notifications/read`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete read notifications');
  }
};
```

### 5.3 Enhanced NotificationContext

**File:** `frontend/src/contexts/NotificationContext.tsx`

**Key additions:**

```typescript
interface NotificationContextValue {
  // Bell state
  unreadCount: number;
  recentNotifications: Notification[];
  isLoadingRecent: boolean;

  // Page state
  notifications: Notification[];
  isLoadingNotifications: boolean;
  pagination: PaginatedNotifications | null;
  currentFilter: NotificationFilter;

  // Toast state
  toasts: Toast[];

  // Connection state
  isConnected: boolean;
  connectionState: ConnectionState;

  // Actions
  fetchRecentNotifications: () => Promise<void>;
  fetchNotifications: (page?: number, filter?: NotificationFilter) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  setFilter: (filter: NotificationFilter) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Socket
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
}
```
