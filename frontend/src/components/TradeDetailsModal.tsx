import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Package, MapPin, CreditCard, User, Building, Calendar, DollarSign, FileText, Loader2, History, AlertTriangle, MessageSquare, Send, Download } from 'lucide-react';
import { getTradeById, Trade, raiseDispute, getTradeDispute, addDisputeMessage, DisputeReason, DisputePriority, TradeDispute, DisputeMessage, downloadPurchaseRequest, downloadPurchaseOrder, downloadInvoice } from '../services/trade.service';
import NegotiationHistory from './NegotiationHistory';
import AuditHistory from './AuditHistory';
import { getImageUrl, getFileUrl } from '../utils/imageUtils';
import CompanyAvatar from './ui/CompanyAvatar';
import ClickableCompanyName from './ui/ClickableCompanyName';

interface TradeDetailsModalProps {
    tradeId: string;
    isOpen: boolean;
    onClose: () => void;
    onNavigateToNegotiation?: () => void;
}

// Dispute reason display names
const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
    payment_issue: 'Payment Issue',
    quality_issue: 'Quality Issue',
    delivery_delay: 'Delivery Delay',
    documentation_problem: 'Documentation Problem',
    communication_issue: 'Communication Issue',
    pricing_dispute: 'Pricing Dispute',
    contract_breach: 'Contract Breach',
    other: 'Other',
};

const DISPUTE_PRIORITY_LABELS: Record<DisputePriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
};

// PHASE 2 REFACTORING: Phases eligible for raising disputes
const DISPUTE_ELIGIBLE_PHASES = ['PAYMENT', 'BOL', 'COMPLETED', 'CANCELLED'];

// Helper to check dispute eligibility
const checkDisputeEligibility = (trade: Trade): { canRaise: boolean; reason?: string; daysRemaining?: number } => {
    const tradePhase = (trade as any).tradePhase;

    // Check if phase allows disputes
    if (!DISPUTE_ELIGIBLE_PHASES.includes(tradePhase)) {
        return {
            canRaise: false,
            reason: `Disputes can only be raised from Payment phase onwards. Current phase: ${tradePhase || 'PR'}`
        };
    }

    // For completed/cancelled trades, check the 30-day window
    if (tradePhase === 'COMPLETED' || tradePhase === 'CANCELLED') {
        const eligibilityEndsAt = (trade as any).disputeEligibilityEndsAt;
        if (eligibilityEndsAt) {
            const endDate = new Date(eligibilityEndsAt);
            const now = new Date();
            if (now > endDate) {
                return {
                    canRaise: false,
                    reason: 'Dispute window has expired (30 days from trade closure)'
                };
            }
            // Calculate days remaining
            const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return { canRaise: true, daysRemaining };
        }
    }

    return { canRaise: true };
};

const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
    tradeId,
    isOpen,
    onClose,
    onNavigateToNegotiation
}) => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trade, setTrade] = useState<Trade | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'audit' | 'dispute'>('details');

    // Determine viewer role from URL path
    const viewerRole = location.pathname.startsWith('/seller') ? 'seller' : 'buyer';

    // Dispute states
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [existingDispute, setExistingDispute] = useState<TradeDispute | null>(null);
    const [disputeLoading, setDisputeLoading] = useState(false);
    const [disputeError, setDisputeError] = useState<string | null>(null);

    // Dispute form states
    const [disputeReason, setDisputeReason] = useState<DisputeReason>('payment_issue');
    const [disputeDescription, setDisputeDescription] = useState('');
    const [disputePriority, setDisputePriority] = useState<DisputePriority>('medium');
    const [submittingDispute, setSubmittingDispute] = useState(false);

    // Dispute message states
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    // Document download states
    const [downloadingPR, setDownloadingPR] = useState(false);
    const [downloadingPO, setDownloadingPO] = useState(false);
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);

    useEffect(() => {
        if (isOpen && tradeId) {
            fetchTrade();
            fetchDispute();
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

    const fetchDispute = async () => {
        try {
            setDisputeLoading(true);
            setDisputeError(null);
            const response = await getTradeDispute(tradeId);
            setExistingDispute(response.data);
        } catch (err: any) {
            // Not an error if no dispute exists
            setExistingDispute(null);
        } finally {
            setDisputeLoading(false);
        }
    };

    const handleRaiseDispute = async () => {
        if (disputeDescription.length < 20) {
            setDisputeError('Description must be at least 20 characters');
            return;
        }

        try {
            setSubmittingDispute(true);
            setDisputeError(null);
            await raiseDispute(tradeId, {
                reason: disputeReason,
                description: disputeDescription,
                priority: disputePriority,
            });
            setShowDisputeModal(false);
            setDisputeDescription('');
            setDisputeReason('payment_issue');
            setDisputePriority('medium');
            await fetchDispute();
            setActiveTab('dispute');
        } catch (err: any) {
            setDisputeError(err.message || 'Failed to raise dispute');
        } finally {
            setSubmittingDispute(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            setSendingMessage(true);
            await addDisputeMessage(tradeId, { content: newMessage.trim() });
            setNewMessage('');
            await fetchDispute();
        } catch (err: any) {
            setDisputeError(err.message || 'Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const getDisputeStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-red-100 text-red-800';
            case 'under_review': return 'bg-amber-100 text-amber-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-amber-100 text-amber-800';
            case 'medium': return 'bg-blue-100 text-blue-800';
            case 'low': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDownloadPR = async () => {
        setDownloadingPR(true);
        try {
            await downloadPurchaseRequest(tradeId);
        } catch (err) {
            console.error('Failed to download purchase request:', err);
        } finally {
            setDownloadingPR(false);
        }
    };

    const handleDownloadPO = async () => {
        setDownloadingPO(true);
        try {
            await downloadPurchaseOrder(tradeId);
        } catch (err) {
            console.error('Failed to download purchase order:', err);
        } finally {
            setDownloadingPO(false);
        }
    };

    const handleDownloadInvoice = async () => {
        setDownloadingInvoice(true);
        try {
            await downloadInvoice(tradeId);
        } catch (err) {
            console.error('Failed to download invoice:', err);
        } finally {
            setDownloadingInvoice(false);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] shadow-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">Trade Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b flex-shrink-0 bg-white">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'details'
                                ? 'text-gray-900 border-b-2 border-[#C4A962]'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Trade Details
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'history'
                                ? 'text-gray-900 border-b-2 border-[#C4A962]'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Negotiation History
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                            activeTab === 'audit'
                                ? 'text-gray-900 border-b-2 border-[#C4A962]'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        Audit Trail
                    </button>
                    {/* Only show Dispute tab for eligible phases (PAYMENT, BOL, COMPLETED, CANCELLED) */}
                    {trade && DISPUTE_ELIGIBLE_PHASES.includes((trade as any).tradePhase) && (
                        <button
                            onClick={() => setActiveTab('dispute')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                                activeTab === 'dispute'
                                    ? 'text-gray-900 border-b-2 border-[#C4A962]'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Dispute
                            {existingDispute && existingDispute.status !== 'closed' && (
                                <span className="ml-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1">
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
                                            src={getImageUrl(trade.product.productImages[0])}
                                            alt={trade.product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-product.svg';
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
                                        {/* Show CANCELLED badge if trade is cancelled */}
                                        {((trade as any).tradePhase === 'CANCELLED' || trade.negotiationStatus === 'cancelled') ? (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                CANCELLED
                                            </span>
                                        ) : (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(trade.negotiationStatus)}`}>
                                                {trade.negotiationStatus?.replace('_', ' ').toUpperCase() || 'PENDING'}
                                            </span>
                                        )}
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
                                    <div className="flex items-center gap-2">
                                        <CompanyAvatar
                                            companyId={(trade.buyer as any)?.company?._id}
                                            companyName={(trade.buyer as any)?.company?.companyName || trade.buyer?.mail || 'Buyer'}
                                            profilePicture={(trade.buyer as any)?.company?.profilePicture}
                                            size="sm"
                                            clickable={viewerRole === 'seller' && !!(trade.buyer as any)?.company?._id}
                                            viewerRole="seller"
                                        />
                                        {viewerRole === 'seller' ? (
                                            <ClickableCompanyName
                                                companyId={(trade.buyer as any)?.company?._id}
                                                companyName={(trade.buyer as any)?.company?.companyName || trade.buyer?.mail || 'N/A'}
                                                className="text-sm text-gray-600"
                                                viewerRole="seller"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-600">{(trade.buyer as any)?.company?.companyName || trade.buyer?.mail || 'N/A'}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm font-medium text-gray-700">Seller</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CompanyAvatar
                                            companyId={(trade.seller as any)?.company?._id}
                                            companyName={(trade.seller as any)?.company?.companyName || trade.seller?.mail || 'Seller'}
                                            profilePicture={(trade.seller as any)?.company?.profilePicture}
                                            size="sm"
                                            clickable={viewerRole === 'buyer' && !!(trade.seller as any)?.company?._id}
                                            viewerRole="buyer"
                                        />
                                        {viewerRole === 'buyer' ? (
                                            <ClickableCompanyName
                                                companyId={(trade.seller as any)?.company?._id}
                                                companyName={(trade.seller as any)?.company?.companyName || trade.seller?.mail || 'N/A'}
                                                className="text-sm text-gray-600"
                                                viewerRole="buyer"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-600">{(trade.seller as any)?.company?.companyName || trade.seller?.mail || 'N/A'}</span>
                                        )}
                                    </div>
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
                                    {/* Port Information */}
                                    {(trade as any).nearestPort && (
                                        <div className="col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <p className="text-xs text-blue-600 mb-1">Nearest Importing Port</p>
                                            <p className="font-medium text-blue-900">{(trade as any).nearestPort}</p>
                                        </div>
                                    )}
                                    {/* CIS Document */}
                                    {(trade as any).buyerCisDocument && (
                                        <div className="col-span-2 p-3 bg-green-50 rounded-lg border border-green-100">
                                            <p className="text-xs text-green-600 mb-1">CIS Document (Customer Information Sheet)</p>
                                            <a
                                                href={getFileUrl((trade as any).buyerCisDocument)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium"
                                            >
                                                <FileText className="w-4 h-4" />
                                                View CIS Document
                                            </a>
                                        </div>
                                    )}
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

                            {/* Download Documents */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 p-3 border-b">
                                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        Download Documents
                                    </h4>
                                </div>
                                <div className="p-4">
                                    <div className="flex flex-wrap gap-3">
                                        {/* Purchase Request - Always available */}
                                        <button
                                            onClick={handleDownloadPR}
                                            disabled={downloadingPR}
                                            className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                                        >
                                            {downloadingPR ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                            Purchase Request
                                        </button>

                                        {/* Purchase Order - Only if accepted */}
                                        {(trade.negotiationStatus === 'accepted' || (trade as any).tradePhase === 'COMPLETED') && (
                                            <button
                                                onClick={handleDownloadPO}
                                                disabled={downloadingPO}
                                                className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                                            >
                                                {downloadingPO ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                                Purchase Order
                                            </button>
                                        )}

                                        {/* Invoice - Only if completed */}
                                        {(trade as any).tradePhase === 'COMPLETED' && (
                                            <button
                                                onClick={handleDownloadInvoice}
                                                disabled={downloadingInvoice}
                                                className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                                            >
                                                {downloadingInvoice ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                                Invoice
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">
                                        {trade.negotiationStatus !== 'accepted' && (trade as any).tradePhase !== 'COMPLETED'
                                            ? 'Purchase Order will be available after the trade is accepted.'
                                            : (trade as any).tradePhase !== 'COMPLETED'
                                            ? 'Invoice will be available after the trade is completed.'
                                            : 'All documents are available for download.'}
                                    </p>
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
                    ) : activeTab === 'dispute' ? (
                        <div className="p-6">
                            {disputeLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                </div>
                            ) : existingDispute ? (
                                // Show existing dispute
                                <div className="space-y-6">
                                    {/* Dispute Status Card */}
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 p-3 border-b">
                                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                Dispute #{existingDispute._id.slice(-8).toUpperCase()}
                                            </h4>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDisputeStatusColor(existingDispute.status)}`}>
                                                        {existingDispute.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(existingDispute.priority)}`}>
                                                        {existingDispute.priority.toUpperCase()} Priority
                                                    </span>
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    Raised on {formatDate(existingDispute.createdAt)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Reason</p>
                                                <p className="text-gray-600">{DISPUTE_REASON_LABELS[existingDispute.reason as DisputeReason]}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Description</p>
                                                <p className="text-gray-600">{existingDispute.description}</p>
                                            </div>
                                            {existingDispute.assignedAdmin && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Assigned Admin</p>
                                                    <p className="text-gray-600">{existingDispute.assignedAdminEmail || existingDispute.assignedAdmin.email}</p>
                                                </div>
                                            )}
                                            {existingDispute.resolutionNotes && (
                                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <p className="text-sm font-medium text-green-800">Resolution</p>
                                                    <p className="text-green-700">{existingDispute.resolutionNotes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 p-3 border-b">
                                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4" />
                                                Messages
                                            </h4>
                                        </div>
                                        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                                            {existingDispute.messages && existingDispute.messages.length > 0 ? (
                                                existingDispute.messages.filter(m => !m.isInternal).map((msg) => (
                                                    <div
                                                        key={msg._id}
                                                        className={`p-3 rounded-lg ${
                                                            msg.senderType === 'admin'
                                                                ? 'bg-purple-50 border border-purple-200'
                                                                : msg.senderType === 'buyer'
                                                                ? 'bg-blue-50 border border-blue-200'
                                                                : 'bg-green-50 border border-green-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-medium capitalize text-gray-600">
                                                                {msg.senderType} • {msg.senderEmail || msg.sender?.mail || msg.sender?.email}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {formatDate(msg.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-700">{msg.content}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-gray-500 text-sm">No messages yet</p>
                                            )}
                                        </div>

                                        {/* Send Message */}
                                        {existingDispute.status !== 'closed' && (
                                            <div className="p-3 border-t bg-gray-50">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                        placeholder="Type a message..."
                                                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A962]/50"
                                                        disabled={sendingMessage}
                                                    />
                                                    <button
                                                        onClick={handleSendMessage}
                                                        disabled={!newMessage.trim() || sendingMessage}
                                                        className="px-3 py-2 bg-[#1a1a2e] text-white rounded-lg hover:bg-[#16162a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {sendingMessage ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Send className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // No dispute - show option to raise one (with eligibility check)
                                (() => {
                                    const eligibility = trade ? checkDisputeEligibility(trade) : { canRaise: false, reason: 'Trade not loaded' };
                                    return (
                                        <div className="text-center py-12">
                                            <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${eligibility.canRaise ? 'text-gray-300' : 'text-yellow-400'}`} />
                                            <h3 className="text-lg font-medium text-gray-700 mb-2">No Dispute</h3>

                                            {eligibility.canRaise ? (
                                                <>
                                                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                                        If you're experiencing issues with this trade, you can raise a dispute. Our admin team will review and help resolve it.
                                                    </p>
                                                    {eligibility.daysRemaining !== undefined && (
                                                        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg inline-block">
                                                            <p className="text-amber-800 text-sm">
                                                                <span className="font-medium">Dispute window:</span> {eligibility.daysRemaining} day{eligibility.daysRemaining !== 1 ? 's' : ''} remaining
                                                            </p>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => setShowDisputeModal(true)}
                                                        className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium inline-flex items-center gap-2"
                                                    >
                                                        <AlertTriangle className="w-4 h-4" />
                                                        Raise a Dispute
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-gray-500 mb-4 max-w-md mx-auto">
                                                        Dispute filing is not available for this trade.
                                                    </p>
                                                    <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg inline-block">
                                                        <p className="text-yellow-800 text-sm">
                                                            {eligibility.reason}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex gap-3 flex-shrink-0 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                        Close
                    </button>
                    {/* Hide "Go to Negotiation" for accepted, rejected, or cancelled trades */}
                    {onNavigateToNegotiation &&
                     trade?.negotiationStatus !== 'accepted' &&
                     trade?.negotiationStatus !== 'rejected' &&
                     trade?.negotiationStatus !== 'cancelled' &&
                     (trade as any)?.tradePhase !== 'CANCELLED' && (
                        <button
                            onClick={onNavigateToNegotiation}
                            className="flex-1 py-2.5 px-4 bg-[#1a1a2e] text-white rounded-lg hover:bg-[#16162a] transition-colors font-medium"
                        >
                            Go to Negotiation
                        </button>
                    )}
                    {/* Raise Dispute button - eligibility is handled by checkDisputeEligibility which includes CANCELLED trades */}
                    {!existingDispute && activeTab === 'details' && trade && (() => {
                        const eligibility = checkDisputeEligibility(trade);
                        return eligibility.canRaise ? (
                            <button
                                onClick={() => setShowDisputeModal(true)}
                                className="py-2.5 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium inline-flex items-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Raise Dispute
                                {eligibility.daysRemaining !== undefined && (
                                    <span className="text-xs opacity-75">({eligibility.daysRemaining}d left)</span>
                                )}
                            </button>
                        ) : null;
                    })()}
                </div>
            </div>

            {/* Raise Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Raise a Dispute
                            </h3>
                            <button
                                onClick={() => {
                                    setShowDisputeModal(false);
                                    setDisputeError(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {disputeError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {disputeError}
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason for Dispute *
                                </label>
                                <select
                                    value={disputeReason}
                                    onChange={(e) => setDisputeReason(e.target.value as DisputeReason)}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4A962]/50"
                                >
                                    {Object.entries(DISPUTE_REASON_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    value={disputePriority}
                                    onChange={(e) => setDisputePriority(e.target.value as DisputePriority)}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4A962]/50"
                                >
                                    {Object.entries(DISPUTE_PRIORITY_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description * <span className="text-gray-400">(min 20 characters)</span>
                                </label>
                                <textarea
                                    value={disputeDescription}
                                    onChange={(e) => setDisputeDescription(e.target.value)}
                                    placeholder="Please describe the issue in detail..."
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4A962]/50 resize-none"
                                />
                                <div className="text-xs text-gray-400 mt-1 text-right">
                                    {disputeDescription.length}/2000 characters
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t bg-gray-50 flex gap-3 rounded-b-xl">
                            <button
                                onClick={() => {
                                    setShowDisputeModal(false);
                                    setDisputeError(null);
                                }}
                                className="flex-1 py-2.5 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                disabled={submittingDispute}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRaiseDispute}
                                disabled={submittingDispute || disputeDescription.length < 20}
                                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            >
                                {submittingDispute ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-4 h-4" />
                                        Submit Dispute
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradeDetailsModal;
