# Breyus Notification System - Implementation Plan

**Use this file to instruct Claude/AI to implement the notification system**

---

## TASK OVERVIEW

Implement a complete notification system for the Breyus commodity trading platform with:
1. **Database persistence** - MongoDB schema for notifications
2. **Notification bell** - Header icon with badge + dropdown (5 recent)
3. **Toast notifications** - Real-time popups for all events
4. **Notifications page** - Full history with filters
5. **Real-time updates** - WebSocket for instant delivery
6. **New message notifications** - Alert when chat message received (if not in inbox)

---

## REQUIREMENTS SUMMARY

| Requirement | Decision |
|-------------|----------|
| Persistence | MongoDB with 30-day retention for read notifications |
| Bell dropdown | Show 5 most recent unread notifications |
| Badge animation | Subtle pulse when new notification arrives |
| Toast triggers | ALL trade events + new messages |
| Inbox scope | Chat only (notifications are separate) |
| Empty state | Illustrated (bell icon + friendly message) |
| Card click | Navigate directly to related item |
| Sound | No sound (visual only) |
| Page layout | Simple list with filter tabs (All, Unread, Trades, Messages) |

---

## NOTIFICATION TYPES

| Type | Trigger Event | Priority | Who Receives |
|------|---------------|----------|--------------|
| `trade_created` | Buyer submits Purchase Request | high | Seller |
| `counter_offer` | Either party sends counter offer | high | Other party |
| `trade_accepted` | Either party accepts terms | high | Other party |
| `trade_rejected` | Either party rejects | normal | Other party |
| `document_uploaded` | Document uploaded (SCO/ICPO/SPA/BoL/Payment) | normal | Other party |
| `documents_invalidated` | Earlier document replaced, later ones invalid | urgent | Affected party |
| `phase_advanced` | Trade moves to next phase | normal | Both parties |
| `trade_completed` | Trade finalized | low | Both parties |
| `trade_cancelled` | Trade cancelled | normal | Other party |
| `new_message` | Chat message received (user not in inbox) | normal | Receiver |
| `analysis_completed` | AI market analysis job finished (async) | normal | Requesting user |

---

## BACKEND IMPLEMENTATION

### 1. Create Notification Module

**Create these files:**

#### `backend/src/notification/schema/notification.schema.ts`
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: ['trade_created', 'counter_offer', 'trade_accepted', 'trade_rejected', 'document_uploaded', 'documents_invalidated', 'phase_advanced', 'trade_completed', 'trade_cancelled', 'new_message', 'analysis_completed'] })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false, index: true })
  read: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Trade' })
  tradeId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation' })
  conversationId?: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' })
  priority: string;

  @Prop()
  actionUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
```

#### `backend/src/notification/notification.service.ts`
Methods to implement:
- `createNotification(dto)` - Save new notification
- `getNotifications(userId, page, limit, filters)` - Paginated list
- `getRecentUnread(userId, limit=5)` - For bell dropdown
- `getUnreadCount(userId)` - For badge number
- `markAsRead(notificationId, userId)` - Mark one read
- `markAllAsRead(userId)` - Mark all read
- `deleteNotification(notificationId, userId)` - Delete one
- `cleanupOldNotifications(daysOld=30)` - Cleanup job

#### `backend/src/notification/notification.controller.ts`
Endpoints:
- `GET /notifications` - Paginated list with filters
- `GET /notifications/recent` - 5 most recent unread
- `GET /notifications/unread-count` - Count for badge
- `PUT /notifications/:id/read` - Mark one as read
- `PUT /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/:id` - Delete one

#### `backend/src/notification/notification.module.ts`
- Register schema, service, controller
- Export NotificationService for use in other modules

### 2. Register Module

**Modify:** `backend/src/app.module.ts`
- Import NotificationModule

### 3. Modify TradeNotificationService

**File:** `backend/src/trade/trade-notification.service.ts`

For EACH notification method (notifyCounterOffer, notifyTradeAccepted, etc.):
1. Inject NotificationService
2. Create and save notification to database
3. Get updated unread count
4. Emit WebSocket event `notification-created` with notification + unreadCount
5. Send email (existing logic)

**Add new method:** `notifyTradeCreated()` - Notify seller when buyer creates PR

### 4. Modify TradeGateway

**File:** `backend/src/trade/trade.gateway.ts`

Add method:
```typescript
emitNotificationCreated(userId: string, data: { notification, unreadCount }) {
  this.notifyUser(userId, 'notification-created', data);
}
```

### 5. Add Trade Created Notification

**File:** `backend/src/trade/trade.service.ts`

In `createTrade()` method, after saving trade:
```typescript
await this.tradeNotificationService.notifyTradeCreated(savedTrade, 'buyer');
```

### 6. Modify InboxGateway for New Message Notifications

**File:** `backend/src/inbox/inbox.gateway.ts`

1. Track which users are active in which conversations
2. On `send-message`, check if receiver is active in conversation
3. If NOT active, create notification and emit `notification-created`

```typescript
// Track active conversations
private activeConversations: Map<string, Set<string>> = new Map();

// On join-conversation: add to tracking
// On leave-conversation: remove from tracking
// On send-message: if receiver not active, create notification
```

---

## FRONTEND IMPLEMENTATION

### 1. Create Types

**File:** `frontend/src/types/notificationTypes.ts`
```typescript
export type NotificationType = 'trade_created' | 'counter_offer' | 'trade_accepted' | 'trade_rejected' | 'document_uploaded' | 'documents_invalidated' | 'phase_advanced' | 'trade_completed' | 'trade_cancelled' | 'new_message';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  tradeId?: string;
  conversationId?: string;
  metadata?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  createdAt: string;
}
```

### 2. Create Notification Service

**File:** `frontend/src/services/notification.service.ts`
- `getNotifications(page, limit, filter)`
- `getRecentNotifications()`
- `getUnreadCount()`
- `markAsRead(id)`
- `markAllAsRead()`
- `deleteNotification(id)`

### 3. Create NotificationBell Component

**File:** `frontend/src/components/NotificationBell.tsx`

Features:
- Bell icon (Lucide `Bell`)
- Red badge with count (hidden if 0, max "99+")
- Pulse animation when count increases
- Click toggles dropdown
- Click outside closes dropdown

### 4. Create NotificationDropdown Component

**File:** `frontend/src/components/NotificationDropdown.tsx`

Features:
- Header: "Notifications" + "Mark all read" button
- List of 5 NotificationItem components
- Empty state with illustration if no notifications
- "See all notifications" link at bottom
- Click item → navigate to actionUrl + mark read + close dropdown

### 5. Create NotificationItem Component

**File:** `frontend/src/components/NotificationItem.tsx`

Features:
- Icon based on notification type
- Title (bold if unread)
- Message preview
- Relative timestamp ("5m ago")
- Unread dot indicator

Icon mapping:
- trade_created → FileText (blue)
- counter_offer → RefreshCw (orange)
- trade_accepted → CheckCircle (green)
- trade_rejected → XCircle (red)
- document_uploaded → Upload (blue)
- documents_invalidated → AlertTriangle (orange)
- phase_advanced → ArrowRight (blue)
- trade_completed → Trophy (green)
- trade_cancelled → Ban (red)
- new_message → MessageSquare (blue)

### 6. Enhance NotificationContext

**File:** `frontend/src/contexts/NotificationContext.tsx`

Add state:
- `unreadCount: number`
- `recentNotifications: Notification[]`
- `notifications: Notification[]` (for page)

Add methods:
- `fetchRecentNotifications()`
- `fetchUnreadCount()`
- `markNotificationRead(id)`
- `markAllNotificationsRead()`

Add WebSocket listener:
```typescript
socketService.onTradeEvent('notification-created', (data) => {
  setUnreadCount(data.unreadCount);
  setRecentNotifications(prev => [data.notification, ...prev].slice(0, 5));
  showToast({ type: getToastType(data.notification.type), title: data.notification.title, message: data.notification.message });
});
```

### 7. Integrate NotificationBell in Headers

**File:** `frontend/src/components/Header.tsx` (or wherever bell icon exists)

Replace static Bell icon with `<NotificationBell />` component.

### 8. Create Notifications Page

**File:** `frontend/src/pages/Notifications.tsx`

Features:
- Filter tabs: All, Unread, Trades, Messages
- Full list of NotificationCard components
- Click card → navigate to related item + mark read
- Delete button on each card
- Pagination
- Empty state with illustration

### 9. Add Routes

**File:** `frontend/src/routes/index.tsx`

Add:
- `/buyer/notifications` → Notifications page
- `/seller/notifications` → Notifications page

### 10. Fix Buyer Inbox WebSocket

**File:** `frontend/src/buyer/pages/Inbox.tsx`

Problem: Uses polling (setInterval every 4 seconds)
Solution: Convert to WebSocket like seller inbox

1. Remove polling interval
2. Import socketService
3. Connect to inbox socket on mount
4. Join conversation room when selected
5. Listen for `message-received`, `user-typing`, `messages-marked-read`

Reference implementation: `frontend/src/seller/pages/inbox.tsx`

---

## FILE SUMMARY

### Backend - Create (6 files)
```
backend/src/notification/
├── notification.module.ts
├── notification.controller.ts
├── notification.service.ts
├── schema/notification.schema.ts
└── dto/
    ├── create-notification.dto.ts
    └── notification-query.dto.ts
```

### Backend - Modify (6 files)
```
backend/src/app.module.ts
backend/src/trade/trade-notification.service.ts
backend/src/trade/trade.gateway.ts
backend/src/trade/trade.service.ts
backend/src/trade/trade.module.ts
backend/src/inbox/inbox.gateway.ts
```

### Frontend - Create (6 files)
```
frontend/src/types/notificationTypes.ts
frontend/src/services/notification.service.ts
frontend/src/components/NotificationBell.tsx
frontend/src/components/NotificationDropdown.tsx
frontend/src/components/NotificationItem.tsx
frontend/src/pages/Notifications.tsx
```

### Frontend - Modify (4 files)
```
frontend/src/components/Header.tsx
frontend/src/contexts/NotificationContext.tsx
frontend/src/routes/index.tsx
frontend/src/buyer/pages/Inbox.tsx
```

---

## IMPLEMENTATION ORDER

1. Backend: Create Notification schema + service + controller + module
2. Backend: Register module in app.module.ts
3. Backend: Modify TradeNotificationService to persist notifications
4. Backend: Add emitNotificationCreated to TradeGateway
5. Backend: Add notifyTradeCreated call in trade.service.ts
6. Backend: Modify InboxGateway for new_message notifications
7. Backend: Emit `analysis_completed` when AI market analysis polling returns completed
8. Frontend: Create types + notification service
9. Frontend: Create NotificationBell + Dropdown + Item components
10. Frontend: Enhance NotificationContext with API + WebSocket
11. Frontend: Replace bell icons in headers
12. Frontend: Create Notifications page + add routes
13. Frontend: Fix Buyer Inbox to use WebSocket
14. Test: End-to-end notification flow

---

## TESTING CHECKLIST

- [ ] Create trade → seller sees notification + toast
- [ ] Submit counter offer → other party sees notification + toast
- [ ] Accept trade → other party sees notification + toast
- [ ] Upload document → other party sees notification + toast
- [ ] Complete AI market analysis job → requester sees `analysis_completed` notification + toast
- [ ] Send chat message (receiver not in inbox) → receiver sees notification + toast
- [ ] Bell badge updates in real-time
- [ ] Bell badge pulses when count increases
- [ ] Dropdown shows 5 most recent
- [ ] Click notification → navigates + marks as read
- [ ] Mark all as read works
- [ ] Notifications page shows full history
- [ ] Filters work (All, Unread, Trades, Messages)
- [ ] Delete notification works
- [ ] Empty states display correctly
- [ ] Buyer inbox receives messages in real-time (no polling)

---

## REFERENCE FILES

For detailed implementation patterns, check these existing files:

- `backend/src/trade/trade-notification.service.ts` - Notification sending pattern
- `backend/src/trade/trade.gateway.ts` - WebSocket gateway pattern
- `backend/src/inbox/inbox.gateway.ts` - Chat WebSocket pattern
- `frontend/src/contexts/NotificationContext.tsx` - Context pattern
- `frontend/src/components/NotificationToast.tsx` - Toast component
- `frontend/src/services/socket.service.ts` - Socket service
- `frontend/src/seller/pages/inbox.tsx` - WebSocket inbox (reference for buyer fix)

---

**Full technical specification:** `context/NOTIFICATION_SYSTEM_SPEC.md`
