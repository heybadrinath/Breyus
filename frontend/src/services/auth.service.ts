const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/auth";

export const logout = async (): Promise<{ message: string }> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Logout failed");
        }

        return await response.json();
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};

export const validateCookie = async (): Promise<{ valid: boolean; role: string }> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/validate-cookie`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error("Invalid or expired session");
        }

        return await response.json();
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};

export const getMe = async (): Promise<{ userId: string; companyId: string }> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error("Failed to get user info");
        }

        return await response.json();
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to send reset email");
        }

        return await response.json();
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};

export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<{ success: boolean }> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, otp, newPassword }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to reset password");
        }

        return await response.json();
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/change-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ currentPassword, newPassword }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to change password");
        }

        return await response.json();
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};

// Notification Preferences Types
export interface NotificationPreferences {
    email: {
        tradeCreated: boolean;
        counterOffer: boolean;
        tradeAccepted: boolean;
        tradeRejected: boolean;
        documentUploaded: boolean;
        documentsInvalidated: boolean;
        phaseAdvanced: boolean;
        tradeCompleted: boolean;
        tradeCancelled: boolean;
    };
    realtime: {
        tradeCreated: boolean;
        counterOffer: boolean;
        tradeAccepted: boolean;
        tradeRejected: boolean;
        documentUploaded: boolean;
        documentsInvalidated: boolean;
        phaseAdvanced: boolean;
        tradeCompleted: boolean;
        tradeCancelled: boolean;
    };
}

const USERS_END_POINT = process.env.REACT_APP_BACKEND_URL + "/users";

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
    try {
        const response = await fetch(`${USERS_END_POINT}/notification-preferences`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to fetch notification preferences");
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};

export const updateNotificationPreferences = async (preferences: NotificationPreferences): Promise<NotificationPreferences> => {
    try {
        const response = await fetch(`${USERS_END_POINT}/notification-preferences`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(preferences),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update notification preferences");
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};

// AI Buddy Notification Preferences (Settings Page)
export interface AINotificationPreferences {
    email?: string;
    useExistingEmail: boolean;
}

export const getAINotificationPreferences = async (): Promise<AINotificationPreferences> => {
    try {
        const response = await fetch(`${USERS_END_POINT}/ai-notification-preferences`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to fetch AI notification preferences");
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};

export const updateAINotificationPreferences = async (preferences: AINotificationPreferences): Promise<AINotificationPreferences> => {
    try {
        const response = await fetch(`${USERS_END_POINT}/ai-notification-preferences`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(preferences),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update AI notification preferences");
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};
