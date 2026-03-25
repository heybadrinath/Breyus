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
    let conversationId: string | undefined;
    if (typeof responseData === 'string') {
      conversationId = responseData;
    } else if (responseData && typeof responseData === 'object') {
      conversationId =
        responseData._id ||
        responseData.conversationId ||
        responseData.id ||
        responseData.data?._id ||
        responseData.data?.conversationId ||
        responseData.data;
    }
    return {
      status: 'success',
      data: conversationId ?? responseData,
      conversationId,
    };
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error creating conversation:', error);

    // Return a more structured error response
    let conversationId = undefined;
    let message = error instanceof Error ? error.message : 'An unknown error occurred';
    if (message.startsWith('Conversation already exists:')) {
      conversationId = message.split(':')[1];
      message = 'Conversation already exists';
    }
    return {
      status: 'error',
      message,
      conversationId,
    };
  }
};


export const getConversation = async (productId: string) => {
  try {
    // Check if the backend URI is defined
    const backendUri = process.env.REACT_APP_BACKEND_URL;
    if (!backendUri) {
      throw new Error('Backend URL is not defined in the environment variables');
    }

    const response = await fetch(`${backendUri}/inbox/get-conversations`, {
      headers: {
        'Content-Type': 'application/json',
      },
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

export const getMessages = async (conversationId: string) => {
  try {
    const backendUri = process.env.REACT_APP_BACKEND_URL;
    if (!backendUri) throw new Error('Backend URL is not defined');
    const response = await fetch(`${backendUri}/inbox/${conversationId}/messages`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    const data = await response.json();
    return { status: 'success', data };
  } catch (error) {
    return { status: 'error', message: 'Failed to fetch messages' };
  }
};

export const sendMessage = async (
  conversationId: string,
  text: string,
  replyTo?: string | null,
) => {
  try {
    const backendUri = process.env.REACT_APP_BACKEND_URL;
    if (!backendUri) throw new Error('Backend URL is not defined');
    const response = await fetch(`${backendUri}/inbox/${conversationId}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, replyTo }),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to send message');
    const data = await response.json();
    console.log(data);
    return { status: 'success', data };
  } catch (error) {
    return { status: 'error', message: 'Failed to send message' };
  }
};

export const markMessagesAsRead = async (conversationId: string) => {
  try {
    const backendUri = process.env.REACT_APP_BACKEND_URL;
    if (!backendUri) throw new Error('Backend URL is not defined');
    const response = await fetch(`${backendUri}/inbox/${conversationId}/mark-read`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to mark messages as read');
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: 'Failed to mark messages as read' };
  }
};

export const getCurrentCompanyId = async () => {
  try {
    const backendUri = process.env.REACT_APP_BACKEND_URL;
    if (!backendUri) throw new Error('Backend URL is not defined');
    const response = await fetch(`${backendUri}/auth/me`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch companyId');
    const data = await response.json();
    return { status: 'success', companyId: data.companyId };
  } catch (error) {
    return { status: 'error', message: 'Failed to fetch companyId' };
  }
};

/**
 * Create a direct conversation with a company (without a product)
 * Used when initiating chat from seller profile page
 */
export const createConversationByCompany = async (targetCompanyId: string) => {
  try {
    const backendUri = process.env.REACT_APP_BACKEND_URL;
    if (!backendUri) {
      throw new Error('Backend URL is not defined in the environment variables');
    }

    const response = await fetch(`${backendUri}/inbox/create-conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetCompanyId }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create conversation');
    }

    const responseData = await response.json();
    let conversationId: string | undefined;
    if (typeof responseData === 'string') {
      conversationId = responseData;
    } else if (responseData && typeof responseData === 'object') {
      conversationId =
        responseData._id ||
        responseData.conversationId ||
        responseData.id ||
        responseData.data?._id ||
        responseData.data?.conversationId ||
        responseData.data;
    }
    return {
      status: 'success',
      data: conversationId ?? responseData,
      conversationId,
    };
  } catch (error) {
    console.error('Error creating conversation by company:', error);

    let conversationId = undefined;
    let message = error instanceof Error ? error.message : 'An unknown error occurred';
    if (message.startsWith('Conversation already exists:')) {
      conversationId = message.split(':')[1];
      message = 'Conversation already exists';
    }
    return {
      status: 'error',
      message,
      conversationId,
    };
  }
};
