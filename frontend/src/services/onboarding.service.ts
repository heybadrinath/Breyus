
const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/onboarding"


// step 1 services
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
        throw new Error("Unauthorised Your Session Expired please Refresh this page and try again!!")
    }
    return response;
}


export const setPasswordService = async (token: string, setPassword: string, confirmPassword: string) => {
    const endpoint = "/set-password";
    const headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    };

    const payload = {
        setPassword: String(setPassword),
        confirmPassword: String(confirmPassword)
    };

    const response = await fetch(`${BACKEND_END_POINT}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Your Session Expired please Refresh this page and try again! access!");
    }

    // Parse and return the response data (message and AccountToken)
    const data = await response.json();
    return data;
};

export const continueOnboardingService = async (token: string, password: string) => {
    const endpoint = "/continue-onboarding";
    const headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }
    const body = {
        password: String(password),
    }

    const response = await fetch(`${BACKEND_END_POINT}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error("Your Session Expired please Refresh this page and try again! access!");
    }

    return response;


}

// step 2 services 
export const step2Service = async (token: string, companyName: string, companyAddress: string, companyMobile: string, taxId: string) => {
    const endpoint = "/step-2";
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token
    }
    const body = {
        companyName,
        companyAddress,
        companyMobile,
        taxId
    }

    const response = await fetch(`${BACKEND_END_POINT}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error("Your Session Expired please Refresh this page and try again! access!");
    }

    return response;


}


// step 3 services 
export enum MeanMonthlyRevenueEnum {
    LessThanoneK = "Less than 1k Dollar",
    one_k_to_ten_k = "1k Dollars - 10k Dollars",
    ten_k_to_hundred_k = "10k Dollars - 100k Dollars",
    hundred_k_to_thousand_k = "100k Dollars - 1000k Dollars",
    MoreThan1000k = "More than 1000k Dollars"
}

export interface Step3Dto {
    mainLineBusiness: string[];
    meanMonthlyRevenue: MeanMonthlyRevenueEnum;
}

export const step3Service = async (token: string, step3Dto: Step3Dto) => {
    const endpoint = "/step-3";
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token
    };
    const body = {
        mainLineBusiness: step3Dto.mainLineBusiness,
        meanMonthlyRevenue: step3Dto.meanMonthlyRevenue
    };

    const response = await fetch(`${BACKEND_END_POINT}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error("Your Session Expired please Refresh this page and try again!");
    }

    return response;
};

export interface Step4Dto {
    websiteUrl: string,
    founderName: string,
    exportedBefore: boolean,
    referrel: string
}


// step 4 Service
export const step4Service = async (token: string, step4Dto: Step4Dto) => {
    const endpoint = "/step-4";
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token
    };
    const body = {
        ...step4Dto
    };

    const response = await fetch(`${BACKEND_END_POINT}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error("Your Session Expired please Refresh this page and try again!");
    }

    return response;
};


// step 5 Service
interface Step5Dto {
    role: string
}

export const step5Service = async (token: string, step5Dto: Step5Dto) => {
    const endpoint = "/step-5";
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token
    };
    const body = {
        ...step5Dto
    };

    const response = await fetch(`${BACKEND_END_POINT}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error("Your Session Expired please Refresh this page and try again!");
    }

    return response;
};



