import React, { useState } from "react";
import { Loader2, Shield, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { changePassword } from "../../services/auth.service";

interface SecurityAccessTabProps {
    userEmail: string;
}

const SecurityAccessTab: React.FC<SecurityAccessTabProps> = ({ userEmail }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const validateForm = (): string | null => {
        if (!currentPassword) {
            return 'Current password is required';
        }
        if (!newPassword) {
            return 'New password is required';
        }
        if (newPassword.length < 8) {
            return 'New password must be at least 8 characters';
        }
        if (newPassword !== confirmPassword) {
            return 'New passwords do not match';
        }
        if (currentPassword === newPassword) {
            return 'New password must be different from current password';
        }
        return null;
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            setSuccessMessage(null);

            await changePassword(currentPassword, newPassword);

            setSuccessMessage('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            console.error('Error changing password:', err);
            setError(err.message || 'Failed to change password. Please check your current password and try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Change Password Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Lock className="h-6 w-6 text-gray-700" />
                    <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
                </div>

                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    {/* Current Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showCurrentPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showNewPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Password must be at least 8 characters
                        </p>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
                        {isSaving ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>

            {/* Logged In Email Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Mail className="h-6 w-6 text-gray-700" />
                    <h3 className="text-xl font-bold text-gray-800">Logged In Email</h3>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700 font-medium">{userEmail}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    This is the email address associated with your account.
                </p>
            </div>
        </div>
    );
};

export default SecurityAccessTab;
