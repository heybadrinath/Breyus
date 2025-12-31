import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface NotificationToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
    id,
    message,
    type,
    duration = 5000,
    onClose,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose(id);
        }, 300);
    };

    if (!isVisible) return null;

    const styles = {
        success: {
            bg: 'bg-green-50 border-green-200',
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            text: 'text-green-800',
        },
        info: {
            bg: 'bg-blue-50 border-blue-200',
            icon: <Info className="w-5 h-5 text-blue-500" />,
            text: 'text-blue-800',
        },
        warning: {
            bg: 'bg-yellow-50 border-yellow-200',
            icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
            text: 'text-yellow-800',
        },
        error: {
            bg: 'bg-red-50 border-red-200',
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            text: 'text-red-800',
        },
    };

    const style = styles[type];

    return (
        <div
            className={`
                max-w-sm w-full ${style.bg} border rounded-lg shadow-lg p-4
                transform transition-all duration-300 ease-in-out
                ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
            `}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{style.icon}</div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${style.text}`}>{message}</p>
                </div>
                <button
                    onClick={handleClose}
                    className={`flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity`}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Toast Container Component
interface ToastContainerProps {
    toasts: Array<{
        id: string;
        message: string;
        type: ToastType;
    }>;
    onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <NotificationToast
                    key={toast.id}
                    id={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={onRemove}
                />
            ))}
        </div>
    );
};

export default NotificationToast;
