import React, { useState, useEffect } from 'react';
import { X, Package, MapPin, CreditCard, User, Building, Calendar, DollarSign, FileText, Loader2, History } from 'lucide-react';
import { getTradeById, Trade } from '../services/trade.service';
import NegotiationHistory from './NegotiationHistory';
import AuditHistory from './AuditHistory';

interface TradeDetailsModalProps {
    tradeId: string;
    isOpen: boolean;
    onClose: () => void;
    onNavigateToNegotiation?: () => void;
}

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
    tradeId,
    isOpen,
    onClose,
    onNavigateToNegotiation
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trade, setTrade] = useState<Trade | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'audit'>('details');

    useEffect(() => {
        if (isOpen && tradeId) {
            fetchTrade();
        }
    }, [isOpen, tradeId]);

    const fetchTrade = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTradeById(tradeId);
            setTrade(response.data as Trade);
        } catch (err: any) {
            setError(err.message || 'Failed to load trade details');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status?: string) => {
        const statusColors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            countered: 'bg-blue-100 text-blue-800',
            buyer_responded: 'bg-purple-100 text-purple-800'
        };
        return statusColors[status || 'pending'] || statusColors.pending;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Trade Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'details'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Trade Details
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'history'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Negotiation History
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                            activeTab === 'audit'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        Audit Trail
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <p className="text-red-500">{error}</p>
                            <button
                                onClick={fetchTrade}
                                className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Retry
                            </button>
                        </div>
                    ) : trade && activeTab === 'details' ? (
                        <div className="p-6 space-y-6">
                            {/* Product Info */}
                            <div className="flex gap-4">
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {trade.product?.productImages?.[0] ? (
                                        <img
                                            src={`${BACKEND_URL}${trade.product.productImages[0]}`}
                                            alt={trade.product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {trade.product?.name || 'Unknown Product'}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xl font-bold text-green-600">
                                            {trade.product?.price} {trade.product?.currency || 'INR'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(trade.negotiationStatus)}`}>
                                            {trade.negotiationStatus?.replace('_', ' ').toUpperCase() || 'PENDING'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Quantity: {trade.quantity} {trade.quantityUnit}
                                    </p>
                                </div>
                            </div>

                            {/* Parties */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">Buyer</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{trade.buyer?.mail || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm font-medium text-gray-700">Seller</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{trade.seller?.mail || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Offers Comparison */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 p-3 border-b">
                                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        Current Offers
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 divide-x">
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 mb-1">Buyer's Offer</p>
                                        <p className="text-lg font-bold text-green-600">
                                            {trade.buyerOfferedPrice || trade.product?.price || 'N/A'}
                                        </p>
                                        {trade.buyerIncoterms?.selectedIncoterm && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Incoterm: {trade.buyerIncoterms.selectedIncoterm}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 mb-1">Seller's Counter</p>
                                        <p className="text-lg font-bold text-green-600">
                                            {trade.sellerOfferedPrice || 'No counter yet'}
                                        </p>
                                        {trade.sellerOfferedIncoterms?.selectedIncoterm && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Incoterm: {trade.sellerOfferedIncoterms.selectedIncoterm}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 p-3 border-b">
                                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Delivery Address
                                    </h4>
                                </div>
                                <div className="p-4">
                                    <p className="font-medium">{trade.selectedAddress?.fullName}</p>
                                    <p className="text-sm text-gray-600">
                                        {trade.selectedAddress?.streetName}
                                        {trade.selectedAddress?.landmark && `, ${trade.selectedAddress.landmark}`}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {trade.selectedAddress?.city}, {trade.selectedAddress?.state} {trade.selectedAddress?.pincode}
                                    </p>
                                    <p className="text-sm text-gray-600">{trade.selectedAddress?.country}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Phone: {trade.selectedAddress?.mobileNumber}
                                    </p>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 p-3 border-b">
                                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        Payment Terms
                                    </h4>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                            {trade.paymentMethod?.type?.toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            via {trade.paymentMethod?.method}
                                        </span>
                                    </div>
                                    {trade.paymentMethod?.percentage && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            Advance: {trade.paymentMethod.percentage}%
                                        </p>
                                    )}
                                    {trade.paymentMethod?.days && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Credit Period: {trade.paymentMethod.days} days
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Trade Info */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 p-3 border-b">
                                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Trade Information
                                    </h4>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Industry Type</p>
                                        <p className="font-medium">{trade.buyerIndustryType || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Market Years</p>
                                        <p className="font-medium">{trade.buyerMarketYears || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Trade Experience</p>
                                        <p className="font-medium">{trade.tradeYears || 'N/A'} years</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Product Usage</p>
                                        <p className="font-medium">{trade.productUsage || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Created: {formatDate(trade.createdAt)}
                                </div>
                                {trade.acceptedAt && (
                                    <div>Accepted: {formatDate(trade.acceptedAt)}</div>
                                )}
                                {trade.rejectedAt && (
                                    <div className="text-red-500">Rejected: {formatDate(trade.rejectedAt)}</div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'history' && trade ? (
                        <NegotiationHistory tradeId={tradeId} />
                    ) : activeTab === 'audit' ? (
                        <div className="p-4">
                            <AuditHistory tradeId={tradeId} />
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                    {onNavigateToNegotiation && trade?.negotiationStatus !== 'accepted' && trade?.negotiationStatus !== 'rejected' && (
                        <button
                            onClick={onNavigateToNegotiation}
                            className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Go to Negotiation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TradeDetailsModal;
