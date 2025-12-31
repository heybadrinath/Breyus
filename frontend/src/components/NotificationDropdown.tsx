import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { recentNotifications, isLoadingRecent, fetchRecentNotifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    fetchRecentNotifications();
  }, [fetchRecentNotifications]);

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    if (notification.actionUrl) {
      if (notification.actionUrl.includes('/dashboard/trades/')) {
        const tradeId = notification.actionUrl.split('/').pop();
        // Determine role from current URL
        const isSeller = window.location.pathname.startsWith('/seller');
        navigate(`/${isSeller ? 'seller' : 'buyer'}/negotiation/${tradeId}`);
      } else {
        navigate(notification.actionUrl);
      }
      onClose();
    }
  };

  const handleViewAll = () => {
    const isSeller = window.location.pathname.startsWith('/seller');
    navigate(`/${isSeller ? 'seller' : 'buyer'}/notifications`);
    onClose();
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        <button 
          onClick={() => markAllAsRead()}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center font-medium"
        >
          <Check size={14} className="mr-1" />
          Mark all read
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {isLoadingRecent && recentNotifications.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <p className="text-sm">Loading notifications...</p>
          </div>
        ) : recentNotifications.length > 0 ? (
          recentNotifications.map(notification => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onClick={handleNotificationClick}
              compact={true}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
              <Bell size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">No new notifications</p>
            <p className="text-xs text-gray-500 mt-1">You're all caught up.</p>
          </div>
        )}
      </div>

      <div className="p-2 border-t bg-gray-50">
        <button 
          onClick={handleViewAll}
          className="w-full py-2 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium flex items-center justify-center"
        >
          View all notifications
          <ExternalLink size={14} className="ml-2" />
        </button>
      </div>
    </div>
  );
};
