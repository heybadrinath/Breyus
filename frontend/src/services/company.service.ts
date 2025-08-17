const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/company";

export interface DeliveryAddress {
    fullName: string;
    mobileNumber: string;
    pincode: string;
    streetName: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    additionalDetails?: string;
}

export const getDeliveryAddresses = async (): Promise<DeliveryAddress[]> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/delivery-addresses`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch delivery addresses: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching delivery addresses:', error);
        throw error;
    }
};

export const addDeliveryAddress = async (address: DeliveryAddress): Promise<DeliveryAddress[]> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/delivery-addresses`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(address),
        });

        if (!response.ok) {
            throw new Error(`Failed to add delivery address: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error adding delivery address:', error);
        throw error;
    }
};

export const updateDeliveryAddress = async (index: number, address: DeliveryAddress): Promise<DeliveryAddress[]> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/delivery-addresses/${index}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(address),
        });

        if (!response.ok) {
            throw new Error(`Failed to update delivery address: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error updating delivery address:', error);
        throw error;
    }
};

export const deleteDeliveryAddress = async (index: number): Promise<DeliveryAddress[]> => {
    try {
        const response = await fetch(`${BACKEND_END_POINT}/delivery-addresses/${index}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to delete delivery address: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error deleting delivery address:', error);
        throw error;
    }
}; 