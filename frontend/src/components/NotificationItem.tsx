import React from 'react';
import { CheckCircle, XCircle, Info, FileText, MessageSquare, RefreshCw, Upload, AlertTriangle, ArrowRight, Trophy, Ban, Trash2 } from 'lucide-react';
import { Notification, NotificationType } from '../types/notificationTypes';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  compact?: boolean; // For dropdown view
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'trade_created':
      return <FileText className="text-blue-500" size={20} />;
    case 'counter_offer':
      return <RefreshCw className="text-orange-500" size={20} />;
    case 'trade_accepted':
      return <CheckCircle className="text-green-500" size={20} />;
    case 'trade_completed':
      return <Trophy className="text-green-500" size={20} />;
    case 'trade_rejected':
      return <XCircle className="text-red-500" size={20} />;
    case 'document_uploaded':
      return <Upload className="text-blue-500" size={20} />;
    case 'documents_invalidated':
      return <AlertTriangle className="text-orange-500" size={20} />;
    case 'phase_advanced':
      return <ArrowRight className="text-blue-500" size={20} />;
    case 'trade_cancelled':
      return <Ban className="text-red-500" size={20} />;
    case 'new_message':
      return <MessageSquare className="text-indigo-500" size={20} />;
    case 'analysis_completed':
      return <FileText className="text-purple-500" size={20} />;
    default:
      return <Info className="text-gray-500" size={20} />;
  }
};

const formatRelativeTime = (value: string): string => {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onRead, 
  onDelete, 
  onClick,
  compact = false 
}) => {
  const { _id, title, message, createdAt, read, type } = notification;

  const handleClick = () => {
    // Prevent triggering if clicked on delete button (if added later)
    if (onClick) onClick(notification);
    if (!read && onRead) onRead(_id);
    
    // If actionUrl exists and used in main page, navigation might happen here or in parent
  };

  const unreadIndicatorClass = onDelete && !compact ? 'right-8' : 'right-2';

  return (
    <div 
      className={`
        relative flex items-start p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0
        ${!read ? 'bg-blue-50/50' : 'bg-white'}
      `}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mr-3 mt-1">
        {getIcon(type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className={`text-sm font-medium ${!read ? 'text-gray-900' : 'text-gray-700'} truncate pr-2`}>
            {title}
          </p>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
            {formatRelativeTime(createdAt)}
          </span>
        </div>
        
        <p className={`text-sm text-gray-600 mt-0.5 ${compact ? 'line-clamp-2' : ''}`}>
          {message}
        </p>
      </div>

      {onDelete && !compact && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(_id);
          }}
          className="ml-3 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Delete notification"
        >
          <Trash2 size={16} />
        </button>
      )}

      {!read && (
        <span className={`absolute top-4 ${unreadIndicatorClass} w-2 h-2 bg-blue-500 rounded-full`}></span>
      )}
    </div>
  );
};
