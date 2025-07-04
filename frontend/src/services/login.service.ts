
const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/login"

export const login = async (mail: string, password: string) => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ mail, password }),
            
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Login failed");
        }

        return await response.json();
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
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
            throw new Error(errorData.message || "Login failed");
        }

        return await response.json();
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
}

