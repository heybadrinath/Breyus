// src/services/conversationService.js

export const createConversation = async (productId: string) => {
  try {
    // Check if the backend URI is defined
    const backendUri = process.env.REACT_APP_BACKEND_URL;
    if (!backendUri) {
      throw new Error('Backend URL is not defined in the environment variables');
    }

    const response = await fetch(`${backendUri}/inbox/create-conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product: productId }),  // Sending productId in the body
      credentials: 'include',  // This ensures signed cookies are sent automatically
    });

    // Check if the response is okay
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create conversation');
    }

    // Return the response data (e.g., conversationId or success data)
    const responseData = await response.json();
    return {
      status: 'success',
      data: responseData,
    };
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error creating conversation:', error);

    // Return a more structured error response
    return {
      status: 'error',
      message: 'An unknown error occurred',
    };
  }
};
