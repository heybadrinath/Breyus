import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Star, Truck, X } from "lucide-react";
import FeedbackModal, { FeedbackData, FeedbackType } from "./FeedbackModal";
import { createFeedback, getMyFeedback, hasUserLeftFeedback, updateFeedback } from "../services/feedback.service";
import { useNotifications } from "../contexts/NotificationContext";

interface TradeCompleteProps {
    isSeller: boolean;
}

const TradeComplete: React.FC<TradeCompleteProps> = ({ isSeller }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useNotifications();
    const searchParams = new URLSearchParams(location.search);
    const tradeId = searchParams.get('tradeId');

    const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
    const [feedbackLeft, setFeedbackLeft] = useState<{ delivery: boolean; product: boolean }>({
        delivery: false,
        product: false
    });
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('delivery');
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackEditing, setFeedbackEditing] = useState(false);
    const [feedbackInitialRating, setFeedbackInitialRating] = useState(0);
    const [feedbackInitialComment, setFeedbackInitialComment] = useState('');
    const [feedbackInitialTags, setFeedbackInitialTags] = useState<string[]>([]);
    const [feedbackInitialDetails, setFeedbackInitialDetails] = useState<Record<string, string>>({});
    const [feedbackLoading, setFeedbackLoading] = useState<FeedbackType | null>(null);

    const handleExplore = () => {
        if (isSeller) {
            navigate('/seller/dashboard');
        } else {
            navigate('/buyer/homepage');
        }
    };

    useEffect(() => {
        const loadFeedbackStatus = async () => {
            if (isSeller || !tradeId) return;
            try {
                const [deliveryCheck, productCheck] = await Promise.all([
                    hasUserLeftFeedback(tradeId, 'delivery'),
                    hasUserLeftFeedback(tradeId, 'product')
                ]);
                const deliveryLeft = deliveryCheck.data?.hasLeftFeedback || false;
                const productLeft = productCheck.data?.hasLeftFeedback || false;
                setFeedbackLeft({ delivery: deliveryLeft, product: productLeft });
                if (!deliveryLeft || !productLeft) {
                    setShowFeedbackPrompt(true);
                }
            } catch (err) {
                console.error('Failed to load feedback status:', err);
                setShowFeedbackPrompt(true);
            }
        };

        loadFeedbackStatus();
    }, [isSeller, tradeId]);

    const openFeedbackModal = async (type: FeedbackType, isEditing = false) => {
        if (!tradeId) return;
        setFeedbackLoading(type);
        setFeedbackType(type);
        setFeedbackEditing(isEditing);
        setFeedbackInitialRating(0);
        setFeedbackInitialComment('');
        setFeedbackInitialTags([]);
        setFeedbackInitialDetails({});

        if (isEditing) {
            try {
                const existing = await getMyFeedback(tradeId, type);
                const existingData = existing.data as any;
                if (existingData) {
                    setFeedbackInitialRating(existingData.rating || 0);
                    setFeedbackInitialComment(existingData.comment || '');
                    setFeedbackInitialTags(existingData.tags || []);
                    setFeedbackInitialDetails(existingData.details || {});
                }
            } catch (err) {
                console.error('Failed to load feedback:', err);
                showToast('Failed to load your feedback. Please try again.', 'error');
                setFeedbackLoading(null);
                return;
            }
        }

        setShowFeedbackModal(true);
        setFeedbackLoading(null);
    };

    const handleFeedbackSubmit = async (data: FeedbackData) => {
        if (!tradeId) return;
        try {
            if (feedbackEditing) {
                await updateFeedback(tradeId, data.feedbackType, {
                    rating: data.rating,
                    comment: data.comment,
                    tags: data.tags,
                    details: data.details
                });
            } else {
                await createFeedback(data);
            }
            if (data.feedbackType === 'delivery' || data.feedbackType === 'product') {
                setFeedbackLeft(prev => ({ ...prev, [data.feedbackType]: true }));
            }
            setShowFeedbackModal(false);
            setFeedbackEditing(false);
            if (data.feedbackType === 'delivery' && feedbackLeft.product) {
                setShowFeedbackPrompt(false);
            }
            if (data.feedbackType === 'product' && feedbackLeft.delivery) {
                setShowFeedbackPrompt(false);
            }
        } catch (err) {
            console.error('Failed to submit feedback:', err);
            showToast('Failed to submit feedback. Please try again.', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-12 text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Thank you!!
                </h1>
                <p className="text-xl text-gray-700 mb-6">
                    for trading with us, leverage more ai and smart trading now
                </p>
                <p className="text-gray-600 mb-12">
                    {isSeller
                        ? "If any inquiry from buyer regarding bill of lading you can clarify here through our chat box"
                        : "If any inquiry Verify your Bill of lading with seller through our chat box"
                    }
                </p>
                <button
                    onClick={handleExplore}
                    className="px-8 py-3 bg-[#0076D3] text-white rounded-lg hover:bg-[#0066b8] transition-colors font-medium"
                >
                    {isSeller ? "Explore more buyers" : "Explore new trades"}
                </button>
            </div>

            {showFeedbackPrompt && !isSeller && tradeId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Share your feedback</h2>
                                <p className="text-sm text-gray-500">Help other buyers and sellers by rating your experience.</p>
                            </div>
                            <button
                                onClick={() => setShowFeedbackPrompt(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <button
                                onClick={() => openFeedbackModal('delivery', feedbackLeft.delivery)}
                                disabled={feedbackLoading === 'delivery'}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors ${
                                    feedbackLeft.delivery ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Truck className={`w-5 h-5 ${feedbackLeft.delivery ? 'text-green-600' : 'text-gray-500'}`} />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {feedbackLeft.delivery ? 'Edit delivery feedback' : 'Leave delivery feedback'}
                                        </p>
                                        <p className="text-xs text-gray-500">Speed, packaging, condition</p>
                                    </div>
                                </div>
                                <CheckCircle className={`w-4 h-4 ${feedbackLeft.delivery ? 'text-green-600' : 'text-gray-300'}`} />
                            </button>

                            <button
                                onClick={() => openFeedbackModal('product', feedbackLeft.product)}
                                disabled={feedbackLoading === 'product'}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors ${
                                    feedbackLeft.product ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Star className={`w-5 h-5 ${feedbackLeft.product ? 'text-green-600' : 'text-gray-500'}`} />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {feedbackLeft.product ? 'Edit product feedback' : 'Leave product feedback'}
                                        </p>
                                        <p className="text-xs text-gray-500">Quality, specs, accuracy</p>
                                    </div>
                                </div>
                                <CheckCircle className={`w-4 h-4 ${feedbackLeft.product ? 'text-green-600' : 'text-gray-300'}`} />
                            </button>
                        </div>
                        <div className="px-6 pb-6">
                            <button
                                onClick={() => setShowFeedbackPrompt(false)}
                                className="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tradeId && (
                <FeedbackModal
                    isOpen={showFeedbackModal}
                    onClose={() => {
                        setShowFeedbackModal(false);
                        setFeedbackEditing(false);
                        setFeedbackInitialRating(0);
                        setFeedbackInitialComment('');
                        setFeedbackInitialTags([]);
                        setFeedbackInitialDetails({});
                    }}
                    onSubmit={handleFeedbackSubmit}
                    feedbackType={feedbackType}
                    tradeId={tradeId}
                    defaultRating={feedbackInitialRating}
                    defaultComment={feedbackInitialComment}
                    defaultTags={feedbackInitialTags}
                    defaultDetails={feedbackInitialDetails}
                    isEditing={feedbackEditing}
                />
            )}
        </div>
    );
};

export default TradeComplete;
