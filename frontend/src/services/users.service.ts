const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/users"

export const usernameService = async () => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/return-name`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include', 
            
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