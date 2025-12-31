import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Loader2 } from "lucide-react";
import { createConversation } from "../../services/inbox.service";

interface LocationState {
    productId?: string;
    sellerEmail?: string;
}

// Mask email for display (e.g., "test@example.com" -> "tes*****@example.com")
const maskEmail = (email?: string): string => {
    if (!email) return "your email";
    const atIndex = email.indexOf('@');
    if (atIndex <= 3) {
        return email.replace(/.(?=.*@)/g, '*');
    }
    const visible = email.substring(0, 3);
    const masked = '*'.repeat(Math.min(atIndex - 3, 5));
    const domain = email.substring(atIndex);
    return `${visible}${masked}${domain}`;
};

const ThankYou = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;
    const [isCreatingChat, setIsCreatingChat] = useState(false);

    const handleChatNow = async () => {
        if (!state?.productId) {
            alert('Unable to start chat. Product information not available.');
            return;
        }

        setIsCreatingChat(true);
        try {
            const result = await createConversation(state.productId);
            if (result.status === 'success') {
                navigate(`/buyer/inbox?conversationId=${result.data}`);
            } else if (result.conversationId) {
                navigate(`/buyer/inbox?conversationId=${result.conversationId}`);
            } else if (result.message?.includes("yourself")) {
                alert("You can't send a message to yourself.");
            } else {
                alert(result.message || 'Failed to create conversation');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            alert('Failed to start chat. Please try again.');
        } finally {
            setIsCreatingChat(false);
        }
    };

    return (
        <div className="w-screen h-screen flex bg-gray-50">
            <div className="w-full max-w-2xl h-fit py-16 px-12 bg-white shadow-lg rounded-xl m-auto flex flex-col">
                {/* Success Heading */}
                <h1 className="text-center text-4xl font-bold text-gray-800 mb-2">
                    Thank you!!
                </h1>
                <h2 className="text-center text-xl font-semibold text-gray-800 mb-6">
                    Your purchase request has been sent Successfully
                </h2>

                {/* Info Message */}
                <p className="text-center text-sm text-gray-600 mb-4">
                    The purchase order / ICPO will be enabled once your request is accepted by seller.
                </p>

                {/* Email Notification */}
                <div className="flex items-center justify-center gap-3 mb-12 bg-gray-50 py-3 px-4 rounded-lg mx-auto">
                    <Mail className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <p className="text-sm text-gray-600">
                        An email has been sent to <span className="font-medium">{maskEmail(state?.sellerEmail)}</span> regarding your purchase request. Please check your inbox for further details.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-8">
                    <button
                        onClick={handleChatNow}
                        disabled={isCreatingChat || !state?.productId}
                        className="px-6 py-2 border border-gray-800 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isCreatingChat ? (
                            <>
                                <Loader2 className="animate-spin h-4 w-4" />
                                Starting Chat...
                            </>
                        ) : (
                            'Chat Now'
                        )}
                    </button>
                    <button
                        onClick={() => navigate('/buyer/trade')}
                        className="px-6 py-2 border border-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Check Request Status
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThankYou;
