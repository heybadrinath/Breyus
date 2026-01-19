import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, MessageCircle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'message';

interface NotificationToastProps {
    id: string;
    message: string;
    title?: string; // Optional title for message toasts
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
    id,
    message,
    title,
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
            titleText: 'text-green-900',
        },
        info: {
            bg: 'bg-blue-50 border-blue-200',
            icon: <Info className="w-5 h-5 text-blue-500" />,
            text: 'text-blue-800',
            titleText: 'text-blue-900',
        },
        warning: {
            bg: 'bg-yellow-50 border-yellow-200',
            icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
            text: 'text-yellow-800',
            titleText: 'text-yellow-900',
        },
        error: {
            bg: 'bg-red-50 border-red-200',
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            text: 'text-red-800',
            titleText: 'text-red-900',
        },
        message: {
            bg: 'bg-white border-gray-200',
            icon: <MessageCircle className="w-5 h-5 text-[#C28500]" />,
            text: 'text-gray-600',
            titleText: 'text-gray-900',
        },
    };

    const style = styles[type];

    // Special layout for message toasts
    if (type === 'message') {
        return (
            <div
                className={`
                    max-w-sm w-full bg-white border border-gray-200 rounded-xl shadow-xl p-4
                    transform transition-all duration-300 ease-in-out
                    ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
                `}
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C28500]/10 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-[#C28500]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        {title && (
                            <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2">{message}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

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
                    {title && (
                        <p className={`text-sm font-semibold ${style.titleText} mb-0.5`}>{title}</p>
                    )}
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
        title?: string;
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
                    title={toast.title}
                    type={toast.type}
                    onClose={onRemove}
                />
            ))}
        </div>
    );
};

export default NotificationToast;
