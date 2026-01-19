import React, { useState, useEffect } from "react";
import { Loader2, Bell, Mail, Zap, Sparkles } from "lucide-react";
import {
    NotificationPreferences,
    getNotificationPreferences,
    updateNotificationPreferences,
    AINotificationPreferences,
    getAINotificationPreferences,
    updateAINotificationPreferences
} from "../../services/auth.service";

// Default preferences when loading fails
const defaultPreferences: NotificationPreferences = {
    email: {
        tradeCreated: true,
        counterOffer: true,
        tradeAccepted: true,
        tradeRejected: true,
        documentUploaded: true,
        documentsInvalidated: true,
        phaseAdvanced: true,
        tradeCompleted: true,
        tradeCancelled: true,
    },
    realtime: {
        tradeCreated: true,
        counterOffer: true,
        tradeAccepted: true,
        tradeRejected: true,
        documentUploaded: true,
        documentsInvalidated: true,
        phaseAdvanced: true,
        tradeCompleted: true,
        tradeCancelled: true,
    },
};

// Notification event labels and descriptions
const notificationEvents = [
    {
        key: 'tradeCreated' as const,
        label: 'New Trade Request',
        description: 'When a new purchase request is created for your products',
    },
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
        key: 'documentsInvalidated' as const,
        label: 'Documents Invalidated',
        description: 'When a document replacement invalidates later documents',
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
    {
        key: 'tradeCancelled' as const,
        label: 'Trade Cancelled',
        description: 'When your trade is cancelled by the counterparty',
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

interface NotificationsTabProps {
    userEmail: string;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ userEmail }) => {
    const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(defaultPreferences);

    // AI Buddy notification preferences
    const [aiPreferences, setAiPreferences] = useState<AINotificationPreferences>({ useExistingEmail: true });
    const [aiEmail, setAiEmail] = useState('');
    const [isSavingAi, setIsSavingAi] = useState(false);

    useEffect(() => {
        fetchPreferences();
        fetchAiPreferences();
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

    const fetchAiPreferences = async () => {
        try {
            const data = await getAINotificationPreferences();
            setAiPreferences(data);
            setAiEmail(data.email || '');
        } catch (err) {
            console.error('Error fetching AI notification preferences:', err);
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

    const handleSaveAiPreferences = async () => {
        try {
            setIsSavingAi(true);
            setError(null);
            const updatedPrefs = await updateAINotificationPreferences({
                useExistingEmail: aiPreferences.useExistingEmail,
                email: aiPreferences.useExistingEmail ? undefined : aiEmail,
            });
            setAiPreferences(updatedPrefs);
            setSuccessMessage('AI notification preferences saved successfully');
        } catch (err) {
            console.error('Error saving AI notification preferences:', err);
            setError('Failed to save AI notification preferences. Please try again.');
        } finally {
            setIsSavingAi(false);
        }
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

            {/* AI Buddy Notification Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800">Breyus AI Buddy</h4>
                        <p className="text-gray-500 text-sm">Where should AI chat interactions be notified?</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="aiEmail"
                            checked={aiPreferences.useExistingEmail}
                            onChange={() => setAiPreferences({ ...aiPreferences, useExistingEmail: true })}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                            Send to Existing mail{' '}
                            <span className="text-gray-500">({userEmail})</span>
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="aiEmail"
                            checked={!aiPreferences.useExistingEmail}
                            onChange={() => setAiPreferences({ ...aiPreferences, useExistingEmail: false })}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
                        />
                        <div className="flex-1">
                            <span className="text-gray-700">Add other Email address</span>
                            {!aiPreferences.useExistingEmail && (
                                <input
                                    type="email"
                                    value={aiEmail}
                                    onChange={(e) => setAiEmail(e.target.value)}
                                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter email address for AI notifications"
                                />
                            )}
                        </div>
                    </label>
                </div>

                <div className="mt-4">
                    <button
                        onClick={handleSaveAiPreferences}
                        disabled={isSavingAi}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSavingAi && <Loader2 className="animate-spin h-4 w-4" />}
                        {isSavingAi ? 'Saving...' : 'Save AI Preferences'}
                    </button>
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
