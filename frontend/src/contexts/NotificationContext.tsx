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

  // Refresh counts
  const refreshUnreadCounts = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      // Since backend gives total, we put it in total. 
      // Breakdown is not supported by backend yet, so we leave specific categories as 0 
      // or we could assume everything is 'ongoing' or similar if needed.
      setUnreadCounts(prev => ({
        ...prev,
        total: count,
        // Optional: Reset others or keep them? Resetting seems safer to avoid confusion.
        pr: 0, po: 0, spa: 0, ongoing: count,
      }));
    } catch (error) {
      console.error('Failed to refresh unread counts', error);
    }
  }, []);

  const refreshUnreadMessageCount = useCallback(async () => {
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
  const handleNotificationCreated = useCallback((payload: { notification: Notification; unreadCount: number }) => {
    console.log('%c[NotificationContext] RECEIVED notification-created:', 'background: green; color: white; font-weight: bold;', payload);
    const { notification, unreadCount } = payload;

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

    // Update count
    setUnreadCounts(prev => ({
       ...prev,
       total: unreadCount,
       ongoing: unreadCount // Simplified mapping
    }));
    if (notification.type === 'new_message') {
      setHasUnreadMessages(true);
      setUnreadCounts(prev => ({ ...prev, messages: prev.messages + 1 }));
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
        if (!isFirstConnectionRef.current && (prevState === 'reconnecting' || prevState === 'disconnected')) {
          showToastRef.current('Connected to real-time updates', 'success');
        }
        isFirstConnectionRef.current = false;
        // Fetch latest notifications on connect/reconnect
        fetchNotifications();
        fetchRecentNotifications();
        refreshUnreadCounts();
        refreshUnreadMessageCount();
      } else if (state === 'reconnecting' && prevState !== 'reconnecting') {
        showToastRef.current('Connection lost. Reconnecting...', 'warning');
      } else if (state === 'failed') {
        showToastRef.current('Unable to connect to real-time updates', 'error');
      }

    lastStateRef.current = state;
  }, [fetchNotifications, fetchRecentNotifications, refreshUnreadCounts]);

  // Connect socket
  const connectTradeSocket = useCallback((userId: string) => {
    console.log('%c[NotificationContext] connectTradeSocket called with userId:', 'background: blue; color: white;', userId);
    if (stateUnsubscribeRef.current) {
      stateUnsubscribeRef.current();
    }

    stateUnsubscribeRef.current = socketService.onTradeStateChange(handleConnectionStateChange);

    console.log('[NotificationContext] Calling socketService.connectTrade()...');
    socketService.connectTrade();
    console.log('[NotificationContext] Calling socketService.joinTrade(' + userId + ')...');
    socketService.joinTrade(userId); // Join user room (often same as userId)

    // Listen for general notification event
    console.log('[NotificationContext] Setting up notification-created listener...');
    socketService.offNotificationCreated();
    socketService.onNotificationCreated(handleNotificationCreated);
    console.log('[NotificationContext] Notification listener setup complete');

    // Previously separate handlers (trade, negotiation, document) are theoretically replaced by notification-created
    // BUT, if frontend *also* needs to update specific UI (like a trade board) based on trade-update,
    // those listeners might still be needed elsewhere.
    // For *Notifcation Context* purposes, we only care about notifications now.
    // However, if we remove other listeners here, does it break anything?
    // The previous context updated notifications based on trade events. Now backend sends notifications directly.
    // So distinct listeners for notifications are redundant *if* we trust notification-created.
    
  }, [handleConnectionStateChange, handleNotificationCreated]);

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
  }, []);

  // Retry
  const retryConnection = useCallback(() => {
    socketService.retryTradeConnection();
  }, []);

  // Actions
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setRecentNotifications(prev => prev.filter(n => n._id !== id));
    try {
      await notificationService.markAsRead(id);
      await refreshUnreadCounts();
      await refreshUnreadMessageCount();
    } catch (error) {
       // Revert or error toast?
       console.error(error);
    }
  }, [refreshUnreadCounts, refreshUnreadMessageCount]);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setRecentNotifications([]);
    setUnreadCounts(defaultUnreadCounts);
    try {
      await notificationService.markAllAsRead();
      await refreshUnreadCounts();
      await refreshUnreadMessageCount();
    } catch (error) {
      console.error(error);
    }
  }, [refreshUnreadCounts, refreshUnreadMessageCount]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    setRecentNotifications(prev => prev.filter(n => n._id !== id));
    try {
      await notificationService.deleteNotification(id);
      await refreshUnreadCounts();
      await refreshUnreadMessageCount();
    } catch (error) {
      console.error(error);
    }
  }, [refreshUnreadCounts, refreshUnreadMessageCount]);

  const clearNotifications = useCallback(async () => {
    // Optimistic clear
    setNotifications([]);
    setRecentNotifications([]);
    setUnreadCounts(defaultUnreadCounts);
    try {
      await notificationService.deleteReadNotifications(); // Or maybe there should be a deleteAll?
      // Spec implies clearing *notifications* usually means read ones or all?
      // implementation_plan said "Delete Read". Let's assume clear clears read ones visually.
      // But user might want to simple clear view.
      // I'll map this to deleteReadNotifications for now as safe default.
      await refreshUnreadMessageCount();
    } catch (error) {
      console.error(error);
    }
  }, [refreshUnreadMessageCount]);

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
      pollIntervalRef.current = setInterval(() => {
        fetchRecentNotifications();
        refreshUnreadCounts();
        refreshUnreadMessageCount();
      }, 30000);
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
