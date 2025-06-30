
const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/onboarding"

export const sendOtpService = async (mail: string) => {

    const endpoint = "/send-otp"
    const body = { email: mail }
    const headers = { 'Content-type': 'application/json' }

    const response = await fetch(`${BACKEND_END_POINT}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw Error("Network error")
    }

}

export const verifyOtpService = async (email: string, otp: string) => {
    const endpoint = "/verify-otp";
    const body = { email, otp };
    const headers = { 'Content-type': 'application/json' };

    const response = await fetch(`${BACKEND_END_POINT}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
    });

    // Check if the response was successful (status code 2xx)
    if (!response.ok) {
        throw new Error(`Failed to verify OTP: ${response.statusText}`);
    }


    const token = await response.json();
    return token;
}

export const validateTokenService = async (token: string) => {
    const endpoint = "/validate-token"
    const headers = {
        'Authorization': token
    }

    const response = await fetch(`${BACKEND_END_POINT}${endpoint}`, {
        method: 'POST',
        headers: headers,
    });

    if (!response.ok) {
        throw new Error("Unauthorised access!")
    }
    return response;
}


export const setPasswordService = async (token: string, setPassword: string, confirmPassword: string) => {
    const endpoint = "/set-password"
    const headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }

    const payload = {
        setPassword: String(setPassword),
        confirmPassword: String(confirmPassword)
    }


    const response = await fetch(`${BACKEND_END_POINT}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error("Unauthorised access!")
    }
    return response;
}



