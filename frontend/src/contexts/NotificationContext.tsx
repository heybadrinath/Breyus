import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { socketService, ConnectionState } from '../services/socket.service';
import { ToastContainer, ToastType } from '../components/NotificationToast'; // Verify this path exists
import { notificationService } from '../services/notification.service';
import { getMe } from '../services/auth.service';
import { Notification } from '../types/notificationTypes';

// Backward compatibility or extended interface
export interface UnreadCounts {
  pr: number;
  po: number;
  spa: number;
  ongoing: number;
  total: number;
  messages: number;
}

interface NotificationState {
  notifications: Notification[];
  recentNotifications: Notification[];
  unreadCounts: UnreadCounts;
  hasUnreadMessages: boolean;
  isConnected: boolean;
  connectionState: ConnectionState;
  isLoading: boolean;
  isLoadingRecent: boolean;
}

interface NotificationContextValue extends NotificationState {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearNotifications: () => void; // Clears local state + calls deleteReadNotifications
  refreshUnreadCounts: () => Promise<void>;
  refreshUnreadMessageCount: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchRecentNotifications: () => Promise<void>;
  connectTradeSocket: (userId: string) => void;
  disconnectTradeSocket: () => void;
  retryConnection: () => void;
}

const defaultUnreadCounts: UnreadCounts = {
  pr: 0,
  po: 0,
  spa: 0,
  ongoing: 0,
  total: 0,
  messages: 0,
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>(defaultUnreadCounts);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; title?: string; type: ToastType }>>([]);

  const stateUnsubscribeRef = useRef<(() => void) | null>(null);
  const isFirstConnectionRef = useRef(true);
  const lastStateRef = useRef<ConnectionState>('disconnected');
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingNotificationsRef = useRef(false);
  const isFetchingRecentRef = useRef(false);
  const pendingUserIdRef = useRef<string | null>(null);
  const listenerAttachedRef = useRef(false);

  // Show a toast notification
  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, title, type }].slice(-5));
  }, []);

  // Remove a toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Use ref for showToast to avoid dependency cycles in event listeners
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Refresh counts - now uses breakdown endpoint for granular tab badges
  const refreshUnreadCounts = useCallback(async () => {
    try {
      const breakdown = await notificationService.getUnreadCountBreakdown();
      setUnreadCounts(breakdown);
      setHasUnreadMessages(breakdown.messages > 0);
    } catch (error) {
      console.error('Failed to refresh unread counts', error);
    }
  }, []);

  const refreshUnreadMessageCount = useCallback(async () => {
    // This is now handled by refreshUnreadCounts via breakdown endpoint,
    // but kept for backward compatibility and explicit message-only refresh
    try {
      const count = await notificationService.getUnreadCount('new_message');
      setUnreadCounts(prev => ({ ...prev, messages: count }));
      setHasUnreadMessages(count > 0);
    } catch (error) {
      console.error('Failed to refresh unread message count', error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (isFetchingNotificationsRef.current) return; // Prevent duplicate fetch
    isFetchingNotificationsRef.current = true;
    setIsLoading(true);
    try {
      const result = await notificationService.getNotifications({ page: 1, limit: 50 });
      setNotifications(result.data);
      if (result.total !== undefined) {
         // Optionally update unread count here if we filtered by unread
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setIsLoading(false);
      isFetchingNotificationsRef.current = false;
    }
  }, []);

  const fetchRecentNotifications = useCallback(async () => {
    if (isFetchingRecentRef.current) return; // Prevent duplicate fetch
    isFetchingRecentRef.current = true;
    setIsLoadingRecent(true);
    try {
      const result = await notificationService.getRecentUnread();
      setRecentNotifications(result);
    } catch (error) {
      console.error('Failed to fetch recent notifications', error);
    } finally {
      setIsLoadingRecent(false);
      isFetchingRecentRef.current = false;
    }
  }, []);

  // Handle new notification from socket
  const handleNotificationCreated = useCallback((payload: {
    notification: Notification;
    unreadCount: number;
    unreadCounts?: UnreadCounts; // New granular breakdown
  }) => {
    console.log('%c[NotificationContext] RECEIVED notification-created:', 'background: green; color: white; font-weight: bold;', payload);
    const { notification, unreadCount, unreadCounts: breakdown } = payload;

    // Update list
    setNotifications((prev) => {
      // Avoid duplicates
      if (prev.some(n => n._id === notification._id)) return prev;
      return [notification, ...prev].slice(0, 50);
    });

    setRecentNotifications((prev) => {
      if (prev.some(n => n._id === notification._id)) return prev;
      return [notification, ...prev].slice(0, 5);
    });

    // Update counts - use breakdown if available (new format), fall back to legacy
    if (breakdown) {
      // New format with full breakdown for trade tab badges
      setUnreadCounts(breakdown);
      setHasUnreadMessages(breakdown.messages > 0);
    } else {
      // Legacy format - only total count available
      setUnreadCounts(prev => ({
        ...prev,
        total: unreadCount,
        ongoing: unreadCount // Simplified fallback mapping
      }));
      if (notification.type === 'new_message') {
        setHasUnreadMessages(true);
        setUnreadCounts(prev => ({ ...prev, messages: prev.messages + 1 }));
      }
    }

    // Show toast
    if (notification.type === 'new_message') {
      // Use special message toast type with title showing sender name
      const senderName = notification.metadata?.senderName || notification.title?.replace('Message from ', '') || 'Someone';
      showToastRef.current(notification.message, 'message', senderName);
    } else {
      let toastType: ToastType = 'info';
      if (notification.type === 'trade_accepted' || notification.type === 'trade_completed' || notification.type === 'analysis_completed') {
        toastType = 'success';
      }
      if (notification.type === 'trade_rejected' || notification.type === 'documents_invalidated' || notification.type === 'trade_cancelled') {
        toastType = 'error';
      }
      if (notification.type === 'counter_offer') toastType = 'warning';

      showToastRef.current(notification.message, toastType);
    }

  }, []);

  // Handle connection state
  const handleConnectionStateChange = useCallback((state: ConnectionState) => {
    const prevState = lastStateRef.current;
    if (prevState === state) return;

    setConnectionState(state);
    setIsConnected(state === 'connected');

    if (state === 'connected') {
      // CRITICAL: Attach listeners and join trade ONLY after socket is connected
      // This fixes the race condition where listeners were set before connection
      if (pendingUserIdRef.current && !listenerAttachedRef.current) {
        console.log('[NotificationContext] Socket connected, attaching listener and joining trade for userId:', pendingUserIdRef.current);
        socketService.offNotificationCreated(); // Remove any stale listeners
        socketService.onNotificationCreated(handleNotificationCreated);
        socketService.joinTrade(pendingUserIdRef.current);
        listenerAttachedRef.current = true;
      }

      if (!isFirstConnectionRef.current && (prevState === 'reconnecting' || prevState === 'disconnected')) {
        showToastRef.current('Connected to real-time updates', 'success');
        // Re-attach listener on reconnect (socket is new)
        if (pendingUserIdRef.current) {
          console.log('[NotificationContext] Reconnected, re-attaching listener for userId:', pendingUserIdRef.current);
          socketService.offNotificationCreated();
          socketService.onNotificationCreated(handleNotificationCreated);
          socketService.joinTrade(pendingUserIdRef.current);
        }
      }
      isFirstConnectionRef.current = false;
      // Fetch latest notifications on connect/reconnect
      fetchNotifications();
      fetchRecentNotifications();
      refreshUnreadCounts();
      refreshUnreadMessageCount();
    } else if (state === 'reconnecting' && prevState !== 'reconnecting') {
      showToastRef.current('Connection lost. Reconnecting...', 'warning');
      // Mark listener as detached since socket will be recreated
      listenerAttachedRef.current = false;
    } else if (state === 'failed') {
      showToastRef.current('Unable to connect to real-time updates', 'error');
      listenerAttachedRef.current = false;
    } else if (state === 'disconnected') {
      listenerAttachedRef.current = false;
    }

    lastStateRef.current = state;
  }, [fetchNotifications, fetchRecentNotifications, refreshUnreadCounts, refreshUnreadMessageCount, handleNotificationCreated]);

  // Connect socket
  const connectTradeSocket = useCallback((userId: string) => {
    console.log('%c[NotificationContext] connectTradeSocket called with userId:', 'background: blue; color: white;', userId);

    // Store userId for use when connection is established
    pendingUserIdRef.current = userId;
    listenerAttachedRef.current = false;

    if (stateUnsubscribeRef.current) {
      stateUnsubscribeRef.current();
    }

    // Set up state change handler FIRST - this will handle listener attachment when connected
    stateUnsubscribeRef.current = socketService.onTradeStateChange(handleConnectionStateChange);

    console.log('[NotificationContext] Calling socketService.connectTrade()...');
    socketService.connectTrade();

    // NOTE: We no longer call joinTrade() or onNotificationCreated() here!
    // These are now called in handleConnectionStateChange when state === 'connected'
    // This fixes the race condition where listeners were attached before the socket was ready
    console.log('[NotificationContext] Connection initiated, listener will be attached after connect event');

  }, [handleConnectionStateChange]);

  // Disconnect socket
  const disconnectTradeSocket = useCallback(() => {
    if (stateUnsubscribeRef.current) {
      stateUnsubscribeRef.current();
      stateUnsubscribeRef.current = null;
    }
    socketService.offNotificationCreated();
    socketService.disconnectTrade();
    setIsConnected(false);
    setConnectionState('disconnected');
    lastStateRef.current = 'disconnected';
    isFirstConnectionRef.current = true;
    pendingUserIdRef.current = null;
    listenerAttachedRef.current = false;
  }, []);

  // Retry
  const retryConnection = useCallback(() => {
    socketService.retryTradeConnection();
  }, []);

  // Actions
  const markAsRead = useCallback(async (id: string) => {
    // Find the notification to check if it was a message type
    const notification = notifications.find(n => n._id === id);
    const wasMessage = notification?.type === 'new_message';

    // Optimistic update
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setRecentNotifications(prev => prev.filter(n => n._id !== id));

    // Optimistically update counts
    if (wasMessage) {
      setUnreadCounts(prev => ({
        ...prev,
        messages: Math.max(0, prev.messages - 1),
        total: Math.max(0, prev.total - 1),
      }));
    } else {
      setUnreadCounts(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    }

    try {
      await notificationService.markAsRead(id);
      // Refresh to get accurate counts from server (also updates hasUnreadMessages)
      await refreshUnreadCounts();
    } catch (error) {
       // Revert or error toast?
       console.error(error);
    }
  }, [notifications, refreshUnreadCounts]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update - clear all counts
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setRecentNotifications([]);
    setUnreadCounts(defaultUnreadCounts);
    setHasUnreadMessages(false);
    try {
      await notificationService.markAllAsRead();
      // Refresh to confirm server state
      await refreshUnreadCounts();
    } catch (error) {
      console.error(error);
      // On error, refresh to get actual state
      await refreshUnreadCounts();
    }
  }, [refreshUnreadCounts]);

  const deleteNotification = useCallback(async (id: string) => {
    // Find the notification to check if it was unread and/or a message
    const notification = notifications.find(n => n._id === id);
    const wasUnread = notification && !notification.read;
    const wasMessage = notification?.type === 'new_message';

    // Remove from local state
    setNotifications(prev => prev.filter(n => n._id !== id));
    setRecentNotifications(prev => prev.filter(n => n._id !== id));

    // Optimistically update counts if it was unread
    if (wasUnread) {
      setUnreadCounts(prev => ({
        ...prev,
        messages: wasMessage ? Math.max(0, prev.messages - 1) : prev.messages,
        total: Math.max(0, prev.total - 1),
      }));
    }

    try {
      await notificationService.deleteNotification(id);
      // Refresh to get accurate counts (also updates hasUnreadMessages)
      await refreshUnreadCounts();
    } catch (error) {
      console.error(error);
    }
  }, [notifications, refreshUnreadCounts]);

  const clearNotifications = useCallback(async () => {
    // Clear read notifications (keeps unread ones)
    setNotifications(prev => prev.filter(n => !n.read));
    // Recent should still show unread
    try {
      await notificationService.deleteReadNotifications();
      // Refresh to get accurate state
      await refreshUnreadCounts();
      await fetchRecentNotifications();
    } catch (error) {
      console.error(error);
    }
  }, [refreshUnreadCounts, fetchRecentNotifications]);

  // Cleanup
  useEffect(() => {
    return () => {
      disconnectTradeSocket();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [disconnectTradeSocket]);

  useEffect(() => {
    if (connectionState === 'connected') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    if (!pollIntervalRef.current) {
      // Poll every 10 seconds when disconnected (reduced from 30s for faster updates)
      pollIntervalRef.current = setInterval(() => {
        fetchRecentNotifications();
        refreshUnreadCounts();
        // Note: refreshUnreadMessageCount not needed - refreshUnreadCounts now includes messages
      }, 10000);
    }
  }, [connectionState, fetchRecentNotifications, refreshUnreadCounts, refreshUnreadMessageCount]);

  useEffect(() => {
    let isMounted = true;
    const setup = async () => {
      try {
        const result = await getMe();
        if (!isMounted || !result?.userId) return;
        connectTradeSocket(result.userId);
        refreshUnreadMessageCount();
      } catch (error) {
        // Ignore missing auth; notifications are only for signed-in users
      }
    };

    setup();

    return () => {
      isMounted = false;
    };
  }, [connectTradeSocket, refreshUnreadMessageCount]);

  // Handle browser visibility change - refresh state when user returns to tab
  // This catches notifications that arrived while the tab was in background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[NotificationContext] Tab became visible, refreshing notification state');
        // Refresh all notification state when user returns
        refreshUnreadCounts();
        fetchRecentNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshUnreadCounts, fetchRecentNotifications]);

  const value: NotificationContextValue = {
    notifications,
    recentNotifications,
    unreadCounts,
    hasUnreadMessages,
    isConnected,
    connectionState,
    isLoading,
    isLoadingRecent,
    showToast,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    refreshUnreadCounts,
    refreshUnreadMessageCount,
    fetchNotifications,
    fetchRecentNotifications,
    connectTradeSocket,
    disconnectTradeSocket,
    retryConnection,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const useUnreadCounts = (): UnreadCounts => {
  const { unreadCounts } = useNotifications();
  return unreadCounts;
};

export const useTradeNotifications = (): Notification[] => {
  const { notifications } = useNotifications();
  return notifications;
};

export default NotificationContext;
