import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Package, Star, Truck, User } from "lucide-react";
import { Feedback as FeedbackEntry, FeedbackType, getSellerFeedbackDashboard, ProductSummary } from "../../services/feedback.service";
import { getImageUrl } from "../../utils/imageUtils";

type DashboardData = {
    summary: {
        totalReviews: number;
        averageRating: number;
        ratingBreakdown: Record<number, number>;
        byType: Record<FeedbackType, { count: number; averageRating: number }>;
    };
    productBreakdown: Array<{
        product: ProductSummary;
        totalReviews: number;
        averageRating: number;
        ratingBreakdown: Record<number, number>;
        latestFeedbackAt?: string;
    }>;
    recentFeedback: FeedbackEntry[];
};

const getProductFromFeedback = (feedback: FeedbackEntry): ProductSummary | null => {
    if (feedback.product) return feedback.product;
    if (typeof feedback.trade === 'object' && feedback.trade?.product) return feedback.trade.product;
    return null;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const StarRating: React.FC<{ rating: number; count?: number }> = ({ rating, count }) => {
    const rounded = Math.round(rating);
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                        key={value}
                        className={`w-4 h-4 ${value <= rounded ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
            {typeof count === 'number' && <span className="text-xs text-gray-500">({count})</span>}
        </div>
    );
};

const getDetailEntries = (details?: FeedbackEntry['details']) => {
    if (!details) return [] as Array<[string, string]>;
    if (details instanceof Map) {
        return Array.from(details.entries()).filter(([, value]) => value);
    }
    if (Array.isArray(details)) {
        return details.filter((entry): entry is [string, string] => Array.isArray(entry) && entry.length === 2);
    }
    return Object.entries(details).filter(([, value]) => value);
};

const detailLabels: Record<string, string> = {
    communication: 'Communication',
    professionalism: 'Professionalism',
    deliverySpeed: 'Delivery speed',
    packageCondition: 'Package condition',
    qualityExpectation: 'Quality vs expectation',
    specAccuracy: 'Specification match',
};

const formatDetailKey = (key: string) => {
    if (detailLabels[key]) return detailLabels[key];
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (char) => char.toUpperCase());
};

export const Feedback = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await getSellerFeedbackDashboard();
                setData(result.data as DashboardData);
            } catch (err: any) {
                setError(err.message || 'Failed to load feedback dashboard');
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const ratingRows = useMemo(() => {
        if (!data) return [];
        const total = data.summary.totalReviews || 0;
        return [5, 4, 3, 2, 1].map((value) => {
            const count = data.summary.ratingBreakdown[value] || 0;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            return { value, count, percent };
        });
    }, [data]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-500">Loading feedback dashboard...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="bg-white border rounded-xl p-8 text-center max-w-lg w-full">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium">{error || 'Unable to load feedback dashboard'}</p>
                    <p className="text-sm text-gray-500 mt-2">Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Feedback Dashboard</h1>
                        <p className="text-sm text-gray-500">Track product performance and buyer satisfaction across completed trades.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    <div className="bg-white border rounded-xl p-5">
                        <p className="text-xs uppercase text-gray-500">Total Feedback</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{data.summary.totalReviews}</p>
                        <p className="text-sm text-gray-500 mt-1">All feedback types</p>
                    </div>
                    <div className="bg-white border rounded-xl p-5">
                        <p className="text-xs uppercase text-gray-500">Average Rating</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{data.summary.averageRating.toFixed(1)}</p>
                        <StarRating rating={data.summary.averageRating} />
                    </div>
                    <div className="bg-white border rounded-xl p-5">
                        <p className="text-xs uppercase text-gray-500">Seller Feedback</p>
                        <div className="flex items-center gap-2 mt-2">
                            <User className="w-5 h-5 text-indigo-500" />
                            <p className="text-xl font-semibold text-gray-900">{data.summary.byType.seller?.count ?? 0}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Avg {(data.summary.byType.seller?.averageRating ?? 0).toFixed(1)}
                        </p>
                    </div>
                    <div className="bg-white border rounded-xl p-5">
                        <p className="text-xs uppercase text-gray-500">Delivery Feedback</p>
                        <div className="flex items-center gap-2 mt-2">
                            <Truck className="w-5 h-5 text-blue-500" />
                            <p className="text-xl font-semibold text-gray-900">{data.summary.byType.delivery?.count ?? 0}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Avg {(data.summary.byType.delivery?.averageRating ?? 0).toFixed(1)}
                        </p>
                    </div>
                    <div className="bg-white border rounded-xl p-5">
                        <p className="text-xs uppercase text-gray-500">Product Feedback</p>
                        <div className="flex items-center gap-2 mt-2">
                            <Package className="w-5 h-5 text-emerald-500" />
                            <p className="text-xl font-semibold text-gray-900">{data.summary.byType.product?.count ?? 0}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Avg {(data.summary.byType.product?.averageRating ?? 0).toFixed(1)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white border rounded-xl p-6 lg:col-span-1">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Breakdown</h2>
                        <div className="space-y-3">
                            {ratingRows.map((row) => (
                                <div key={row.value} className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-700 w-10">{row.value}★</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400" style={{ width: `${row.percent}%` }} />
                                    </div>
                                    <span className="text-xs text-gray-500 w-8 text-right">{row.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border rounded-xl p-6 lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Top Product Feedback</h2>
                            <span className="text-xs text-gray-500">Product-type feedback only</span>
                        </div>
                        {data.productBreakdown.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
                                No product feedback yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.productBreakdown.slice(0, 6).map((productItem) => (
                                    <div key={productItem.product._id} className="border rounded-xl p-4 flex gap-4">
                                        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                                            {productItem.product.productImages?.[0] ? (
                                                <img
                                                    src={getImageUrl(productItem.product.productImages[0])}
                                                    alt={productItem.product.name || 'Product'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                                    }}
                                                />
                                            ) : (
                                                <Package className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {productItem.product.name || 'Unnamed product'}
                                            </p>
                                            <StarRating rating={productItem.averageRating} count={productItem.totalReviews} />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Last feedback {formatDate(productItem.latestFeedbackAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h2>
                    {data.recentFeedback.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 py-10">No feedback submitted yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {data.recentFeedback.map((feedback) => {
                                const product = getProductFromFeedback(feedback);
                                const detailEntries = getDetailEntries(feedback.details);
                                return (
                                    <div key={feedback._id} className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                                <span className="capitalize">{feedback.feedbackType} feedback</span>
                                                <span className="text-xs text-gray-400">•</span>
                                                <span className="text-xs text-gray-500">{formatDate(feedback.createdAt)}</span>
                                            </div>
                                            {product && (
                                                <p className="text-xs text-gray-500">Product: {product.name || 'Unnamed product'}</p>
                                            )}
                                            {feedback.comment && (
                                                <p className="text-sm text-gray-700 line-clamp-2">{feedback.comment}</p>
                                            )}
                                            {detailEntries.length > 0 && (
                                                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                                    {detailEntries.map(([key, value]) => (
                                                        <span key={key} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                                                            <span className="font-medium text-gray-700">{formatDetailKey(key)}:</span>
                                                            {value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {feedback.tags && feedback.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {feedback.tags.map((tag) => (
                                                        <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <StarRating rating={feedback.rating} />
                                            <span className="text-xs text-gray-500">Buyer {feedback.reviewer?.mail || 'N/A'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
