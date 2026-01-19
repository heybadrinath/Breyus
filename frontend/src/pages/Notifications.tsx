import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Trash2, Filter, Loader } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { notificationService } from '../services/notification.service';
import { Notification, NotificationType } from '../types/notificationTypes';
import { NotificationItem } from '../components/NotificationItem';
import { SearchHeaderLight } from '../components/Header';

const Notifications = () => {
    const { 
        markAsRead, 
        markAllAsRead, 
        clearNotifications,
        deleteNotification,
    } = useNotifications();
    const navigate = useNavigate();

    const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'trade' | 'message'>('all');
    const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Fetch initial data
    useEffect(() => {
        loadNotifications(1, true);
    }, [activeFilter]);

    const loadNotifications = async (pageNum: number, reset: boolean = false) => {
        setLoading(true);
        try {
            const query: any = { page: pageNum, limit: 20 };
            
            if (activeFilter === 'unread') query.unreadOnly = true;
            if (activeFilter === 'message') query.type = 'new_message';
            // For 'trade', we might need to list multiple types or use a category if backend supports it.
            // My backend service supports 'category' param which maps to types.
            if (activeFilter === 'trade') query.category = 'trade';

            const result = await notificationService.getNotifications(query);
            
            setLocalNotifications(prev => reset ? result.data : [...prev, ...result.data]);
            setHasMore(pageNum < result.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadNotifications(page + 1, false);
        }
    };

    const handleRead = async (id: string) => {
        await markAsRead(id);
        setLocalNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
        setLocalNotifications(prev => prev.filter(n => n._id !== id));
    };

    const handleItemClick = (notification: Notification) => {
        if (notification.actionUrl) {
            if (notification.actionUrl.includes('/dashboard/trades/')) {
                const tradeId = notification.actionUrl.split('/').pop();
                const isSeller = window.location.pathname.startsWith('/seller');
                navigate(`/${isSeller ? 'seller' : 'buyer'}/negotiation/${tradeId}`);
            } else {
                navigate(notification.actionUrl);
            }
        }
    };

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'unread', label: 'Unread' },
        { id: 'trade', label: 'Trades' },
        { id: 'message', label: 'Messages' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                <SearchHeaderLight />
            </div>
            <div className="flex-1 p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                            <p className="text-gray-500 mt-1">Manage your activity and alerts</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => markAllAsRead().then(() => setLocalNotifications(prev => prev.map(n => ({...n, read: true})))) }
                                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Check size={16} className="mr-2" />
                                Mark all read
                            </button>
                            <button
                                onClick={() => {
                                    clearNotifications();
                                    setLocalNotifications(prev => prev.filter(n => !n.read));
                                }} // Clear read notifications from backend + local list
                                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Clear read
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex overflow-x-auto pb-4 mb-4 gap-2 border-b border-gray-200">
                        {filters.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id as any)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                                    ${activeFilter === filter.id
                                        ? 'bg-black text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                `}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                        {localNotifications.length > 0 ? (
                            <div>
                                {localNotifications.map(notification => (
                                    <NotificationItem
                                        key={notification._id}
                                        notification={notification}
                                        onRead={handleRead}
                                        onDelete={handleDelete}
                                        onClick={handleItemClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            !loading && (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                                        <Filter size={32} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No notifications found</h3>
                                    <p className="max-w-xs text-center mt-2">
                                        We couldn't find any notifications matching your current filter.
                                    </p>
                                </div>
                            )
                        )}

                        {loading && (
                            <div className="flex justify-center py-8">
                                <Loader className="animate-spin text-gray-400" size={24} />
                            </div>
                        )}

                        {!loading && hasMore && localNotifications.length > 0 && (
                            <button
                                onClick={handleLoadMore}
                                className="w-full py-4 text-sm font-medium text-blue-600 hover:bg-gray-50 border-t transition-colors"
                            >
                                Load More
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
