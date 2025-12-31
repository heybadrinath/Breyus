
const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/login"

export const login = async (mail: string, password: string) => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ mail, password }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Preserve backend error message
            throw new Error(errorData.message || "Unable to send OTP. Please check your credentials.");
        }

        return await response.json();
    } catch (error) {
        // Re-throw with the original message to preserve backend error messages
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unexpected error occurred. Please try again.");
    }
}

export const validateOtp  = async (mail: string, otp: string) => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/validate-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ mail, otp}),
            credentials: 'include'

        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Preserve backend error message
            throw new Error(errorData.message || "Invalid or expired OTP. Please try again.");
        }

        return await response.json();
    } catch (error) {
        // Re-throw with the original message to preserve backend error messages
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unexpected error occurred. Please try again.");
    }
}

