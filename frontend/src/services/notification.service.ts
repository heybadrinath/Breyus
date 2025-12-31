import {
    Notification,
    NotificationQuery,
    PaginatedNotifications
} from '../types/notificationTypes';

const API_URL = process.env.REACT_APP_BACKEND_URL;

class NotificationService {
    private getHeaders() {
        return {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Get paginated notifications
     */
    async getNotifications(query: NotificationQuery = {}): Promise<PaginatedNotifications> {
        try {
            const params = new URLSearchParams();
            if (query.page) params.append('page', query.page.toString());
            if (query.limit) params.append('limit', query.limit.toString());
            if (query.unreadOnly !== undefined) params.append('unreadOnly', query.unreadOnly.toString());
            if (query.type) params.append('type', query.type);
            if (query.category) params.append('category', query.category);

            const response = await fetch(`${API_URL}/notifications?${params.toString()}`, {
                method: 'GET',
                headers: this.getHeaders(),
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to fetch notifications');

            const result = await response.json();
            return result.data || result; // Handle potential NestJS standard response wrapper
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    /**
     * Get recent unread notifications
     */
    async getRecentUnread(limit: number = 5): Promise<Notification[]> {
        try {
            const response = await fetch(`${API_URL}/notifications/recent?limit=${limit}`, {
                method: 'GET',
                headers: this.getHeaders(),
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to fetch recent notifications');

            const result = await response.json();
            return result.data || result;
        } catch (error) {
            console.error('Error fetching recent notifications:', error);
            throw error;
        }
    }

    /**
     * Get total unread count
     */
    async getUnreadCount(): Promise<number> {
        try {
            const response = await fetch(`${API_URL}/notifications/unread-count`, {
                method: 'GET',
                headers: this.getHeaders(),
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to fetch unread count');

            const result = await response.json();
            if (typeof result?.data === 'number') return result.data;
            if (typeof result?.data?.count === 'number') return result.data.count;
            return typeof result?.count === 'number' ? result.count : 0;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(id: string): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: this.getHeaders(),
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to mark notification as read');
        } catch (error) {
            console.error(`Error marking notification ${id} as read:`, error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
                method: 'PUT',
                headers: this.getHeaders(),
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to mark all as read');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Delete a notification
     */
    async deleteNotification(id: string): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to delete notification');
        } catch (error) {
            console.error(`Error deleting notification ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete all read notifications
     */
    async deleteReadNotifications(): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/notifications/read`, {
                method: 'DELETE',
                headers: this.getHeaders(),
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to delete read notifications');
        } catch (error) {
            console.error('Error deleting read notifications:', error);
            throw error;
        }
    }
}

export const notificationService = new NotificationService();
