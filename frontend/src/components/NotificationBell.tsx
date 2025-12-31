import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useUnreadCounts } from '../contexts/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  className?: string; // Allow styling from parent
  color?: string;     // Icon color
  size?: number;      // Icon size
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  className = '', 
  color = 'currentColor', 
  size = 22 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const unreadCounts = useUnreadCounts();
  const totalUnread = unreadCounts.total;
  const prevCountRef = useRef(totalUnread);

  useEffect(() => {
    if (totalUnread > prevCountRef.current) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1200);
      prevCountRef.current = totalUnread;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totalUnread;
  }, [totalUnread]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <div 
        className={`relative cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        onClick={toggleDropdown}
      >
        <Bell color={color} size={size} />
        
        {totalUnread > 0 && (
          <>
            {showPulse && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 rounded-full bg-red-400 opacity-70 animate-ping" />
            )}
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
          </>
        )}
      </div>

      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
};
