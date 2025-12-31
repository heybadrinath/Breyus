import React, { useState, useEffect } from "react";
import { Loader2, Bell, Mail, Zap } from "lucide-react";
import {
    NotificationPreferences,
    getNotificationPreferences,
    updateNotificationPreferences
} from "../../services/auth.service";

// Default preferences when loading fails
const defaultPreferences: NotificationPreferences = {
    email: {
        counterOffer: true,
        tradeAccepted: true,
        tradeRejected: true,
        documentUploaded: true,
        phaseAdvanced: true,
        tradeCompleted: true,
    },
    realtime: {
        counterOffer: true,
        tradeAccepted: true,
        tradeRejected: true,
        documentUploaded: true,
        phaseAdvanced: true,
        tradeCompleted: true,
    },
};

// Notification event labels and descriptions
const notificationEvents = [
    {
        key: 'counterOffer' as const,
        label: 'Counter Offers',
        description: 'When a counterparty sends a counter-offer on your trade',
    },
    {
        key: 'tradeAccepted' as const,
        label: 'Trade Accepted',
        description: 'When your trade is accepted by the counterparty',
    },
    {
        key: 'tradeRejected' as const,
        label: 'Trade Rejected',
        description: 'When your trade is rejected by the counterparty',
    },
    {
        key: 'documentUploaded' as const,
        label: 'Document Uploaded',
        description: 'When a new document is uploaded to your trade',
    },
    {
        key: 'phaseAdvanced' as const,
        label: 'Phase Advanced',
        description: 'When your trade advances to the next phase',
    },
    {
        key: 'tradeCompleted' as const,
        label: 'Trade Completed',
        description: 'When your trade is marked as completed',
    },
];

interface ToggleSwitchProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, disabled }) => (
    <button
        type="button"
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            enabled ? 'bg-blue-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
        />
    </button>
);

const NotificationsTab: React.FC = () => {
    const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(defaultPreferences);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getNotificationPreferences();
            setPreferences(data);
            setOriginalPreferences(data);
        } catch (err) {
            console.error('Error fetching notification preferences:', err);
            setError('Failed to load notification preferences. Using defaults.');
            setPreferences(defaultPreferences);
            setOriginalPreferences(defaultPreferences);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (
        category: 'email' | 'realtime',
        eventKey: keyof NotificationPreferences['email']
    ) => {
        setPreferences(prev => {
            const newPrefs = {
                ...prev,
                [category]: {
                    ...prev[category],
                    [eventKey]: !prev[category][eventKey],
                },
            };
            setHasChanges(JSON.stringify(newPrefs) !== JSON.stringify(originalPreferences));
            return newPrefs;
        });
        setSuccessMessage(null);
    };

    const handleEnableAll = (category: 'email' | 'realtime') => {
        setPreferences(prev => {
            const newPrefs = {
                ...prev,
                [category]: Object.fromEntries(
                    Object.keys(prev[category]).map(key => [key, true])
                ) as NotificationPreferences['email'],
            };
            setHasChanges(JSON.stringify(newPrefs) !== JSON.stringify(originalPreferences));
            return newPrefs;
        });
        setSuccessMessage(null);
    };

    const handleDisableAll = (category: 'email' | 'realtime') => {
        setPreferences(prev => {
            const newPrefs = {
                ...prev,
                [category]: Object.fromEntries(
                    Object.keys(prev[category]).map(key => [key, false])
                ) as NotificationPreferences['email'],
            };
            setHasChanges(JSON.stringify(newPrefs) !== JSON.stringify(originalPreferences));
            return newPrefs;
        });
        setSuccessMessage(null);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);
            const updatedPrefs = await updateNotificationPreferences(preferences);
            setPreferences(updatedPrefs);
            setOriginalPreferences(updatedPrefs);
            setHasChanges(false);
            setSuccessMessage('Notification preferences saved successfully');
        } catch (err) {
            console.error('Error saving notification preferences:', err);
            setError('Failed to save notification preferences. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setPreferences(originalPreferences);
        setHasChanges(false);
        setSuccessMessage(null);
        setError(null);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="animate-spin h-8 w-8 text-gray-500 mb-4" />
                <p className="text-gray-500">Loading notification preferences...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Bell className="h-6 w-6 text-gray-700" />
                    <h3 className="text-xl font-bold text-gray-800">Notification Preferences</h3>
                </div>
                <p className="text-gray-500 text-sm">
                    Choose how you want to be notified about trade events. You can receive notifications via email and/or real-time alerts.
                </p>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Email Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <h4 className="text-lg font-semibold text-gray-800">Email Notifications</h4>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleEnableAll('email')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Enable All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={() => handleDisableAll('email')}
                            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Disable All
                        </button>
                    </div>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                    Receive email notifications when important events occur in your trades.
                </p>
                <div className="space-y-4">
                    {notificationEvents.map(event => (
                        <div key={`email-${event.key}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div>
                                <p className="font-medium text-gray-700">{event.label}</p>
                                <p className="text-sm text-gray-500">{event.description}</p>
                            </div>
                            <ToggleSwitch
                                enabled={preferences.email[event.key]}
                                onChange={() => handleToggle('email', event.key)}
                                disabled={isSaving}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Real-time Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <h4 className="text-lg font-semibold text-gray-800">Real-time Notifications</h4>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleEnableAll('realtime')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Enable All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={() => handleDisableAll('realtime')}
                            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Disable All
                        </button>
                    </div>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                    Get instant in-app notifications for real-time updates on your trades.
                </p>
                <div className="space-y-4">
                    {notificationEvents.map(event => (
                        <div key={`realtime-${event.key}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div>
                                <p className="font-medium text-gray-700">{event.label}</p>
                                <p className="text-sm text-gray-500">{event.description}</p>
                            </div>
                            <ToggleSwitch
                                enabled={preferences.realtime[event.key]}
                                onChange={() => handleToggle('realtime', event.key)}
                                disabled={isSaving}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Save/Cancel Buttons */}
            {hasChanges && (
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationsTab;
