
export const submitStep1 = async (formData: {
  name: string;
  location: string;
  mail: string;
  contactNumber: string;
  taxId: string;
}) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/onboarding/step1`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
      credentials: 'include', 
      mode: 'cors'
    });

    // Check if the response is OK (status 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json(); // Parse JSON response
    return data; // Return the data if the request is successful
  } catch (error) {
    console.error('Error in Step 1 submission:', error);
    throw error; // Re-throw the error so the caller can handle it
  }
};
