import React, { useState, useEffect } from "react";
import { getUserTrades, Trade } from "../../services/trade.service";
import { TryBreyusCoreHeader } from "../../components/Header";
import { useNavigate } from "react-router-dom";

export const TradeRequests = () => {
    const navigate = useNavigate();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                setLoading(true);
                const response = await getUserTrades();
                if (response.statusCode === 200) {
                    setTrades(Array.isArray(response.data) ? response.data : []);
                } else {
                    setError(response.message || 'Failed to fetch trades');
                }
            } catch (error) {
                console.error('Error fetching trades:', error);
                setError('Failed to fetch trades');
            } finally {
                setLoading(false);
            }
        };

        fetchTrades();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'accepted':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <>
                <TryBreyusCoreHeader />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading trade requests...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <TryBreyusCoreHeader />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-gray-400 text-6xl mb-4">❌</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Trade Requests</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/buyer/homepage')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Back to Homepage
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <TryBreyusCoreHeader />
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Trade Requests</h1>
                        <p className="text-gray-600">View and manage your purchase requests</p>
                    </div>

                    {trades.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <div className="text-gray-400 text-6xl mb-4">📦</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trade Requests Yet</h3>
                            <p className="text-gray-600 mb-6">You haven't made any purchase requests yet.</p>
                            <button
                                onClick={() => navigate('/buyer/homepage')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Browse Products
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {trades.map((trade) => (
                                <div key={trade._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-4">
                                                <img
                                                    src={trade.product.productImages?.[0] || '/placeholder-product.svg'}
                                                    alt={trade.product.name}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = '/placeholder-product.svg';
                                                    }}
                                                />
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {trade.product.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        Quantity: {trade.quantity} {trade.quantityUnit}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Price: {trade.product.price} {trade.product.currency}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trade.tradeStatus)}`}>
                                                {trade.tradeStatus}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700">Created:</span>
                                                <p className="text-gray-600">{formatDate(trade.createdAt)}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Seller:</span>
                                                <p className="text-gray-600">{trade.seller.mail}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Payment Method:</span>
                                                <p className="text-gray-600">
                                                    {trade.paymentMethod.type === 'advance' && 'Advance Payment'}
                                                    {trade.paymentMethod.type === 'credit' && 'Credit Period'}
                                                    {trade.paymentMethod.type === 'openAccount' && 'Open Account'}
                                                </p>
                                            </div>
                                        </div>

                                        {trade.buyerMessage && (
                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                <span className="font-medium text-gray-700">Additional Message:</span>
                                                <p className="text-gray-600 mt-1">{trade.buyerMessage}</p>
                                            </div>
                                        )}

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-600">
                                                    Trade ID: {trade._id}
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/buyer/trade-details/${trade._id}`)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    View Details →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}; 