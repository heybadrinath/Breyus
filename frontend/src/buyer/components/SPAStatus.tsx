import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Filter, MessageCircle, Loader2 } from "lucide-react";
import { getUserTrades, Trade, TradePhase, PaymentMethod, SPADocumentInfo } from "../../services/trade.service";
import { createConversation } from "../../services/inbox.service";
import SelectField from "../../components/SelectField";
import TrackTrade from "../../components/TrackTrade";
import TradeAbbreviation from "../../components/ui/TradeAbbreviation";
import { useNotifications } from "../../contexts/NotificationContext";

interface TradeWithProduct extends Omit<Trade, 'paymentMethod'> {
    product: {
        _id: string;
        name: string;
        price: string;
        currency: string;
        productImages: string[];
    };
    seller: {
        _id: string;
        mail: string;
    };
    tradePhase?: TradePhase;
    paymentMethod?: PaymentMethod;
    spaDocument?: SPADocumentInfo;
}

// Document phases to filter for - strict SPA phase only
const DOCUMENT_PHASES: TradePhase[] = ['SPA'];

export const BuyerSPAStatus: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useNotifications();
    const [searchParams] = useSearchParams();
    const tradeIdParam = searchParams.get('tradeId');

    const [trades, setTrades] = useState<TradeWithProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [entriesPerPage, setEntriesPerPage] = useState(5);
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(tradeIdParam);
    // Issue #20 - Use Set to track multiple concurrent chat operations
    const [chattingProductIds, setChattingProductIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchTrades();
    }, []);

    // Auto-select trade from URL param when trades are loaded
    useEffect(() => {
        if (tradeIdParam && trades.length > 0 && !selectedTradeId) {
            // Check if the trade exists in our list
            const tradeExists = trades.some(t => t._id === tradeIdParam);
            if (tradeExists) {
                setSelectedTradeId(tradeIdParam);
            }
        }
    }, [tradeIdParam, trades, selectedTradeId]);

    const fetchTrades = async () => {
        try {
            setLoading(true);
            const response = await getUserTrades();
            // Filter for trades in document phases (SCO through BOL)
            const documentPhaseTrades = (response.data as TradeWithProduct[]).filter(
                trade => trade.negotiationStatus === 'accepted' &&
                         trade.tradePhase &&
                         DOCUMENT_PHASES.includes(trade.tradePhase)
            );
            setTrades(documentPhaseTrades);
        } catch (err) {
            setError('Failed to fetch trades');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChat = async (productId: string) => {
        // Issue #20 - Prevent double-clicks on same product
        if (chattingProductIds.has(productId)) {
            return;
        }
        try {
            // Issue #20 - Add to Set of chatting products
            setChattingProductIds(prev => new Set(prev).add(productId));
            const result = await createConversation(productId);
            if (result.status === 'success') {
                navigate(`/buyer/inbox?conversationId=${result.data}`);
            } else if (result.conversationId) {
                navigate(`/buyer/inbox?conversationId=${result.conversationId}`);
            } else if (result.message?.includes("yourself")) {
                showToast("You can't send a message to yourself.", 'error');
            } else {
                showToast(result.message || 'Failed to create conversation', 'error');
            }
        } catch (error) {
            console.error("Error creating conversation:", error);
            showToast('Error creating conversation', 'error');
        } finally {
            // Issue #20 - Remove from Set of chatting products
            setChattingProductIds(prev => {
                const next = new Set(prev);
                next.delete(productId);
                return next;
            });
        }
    };

    const handleTrack = (tradeId: string) => {
        setSelectedTradeId(tradeId);
    };

    const getStatusBadge = (trade: TradeWithProduct) => {
        const spaDoc = trade.spaDocument;

        // SPA uploaded and approved
        if (spaDoc?.status === 'approved') {
            return (
                <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    Approved
                </span>
            );
        }
        // SPA uploaded, under review
        if (spaDoc?.status === 'uploaded') {
            return (
                <span className="flex items-center gap-1 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Under Review
                </span>
            );
        }
        // SPA rejected
        if (spaDoc?.status === 'rejected') {
            return (
                <span className="flex items-center gap-1 text-red-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    Rejected
                </span>
            );
        }
        // No SPA uploaded yet — waiting for seller
        return (
            <span className="flex items-center gap-1 text-yellow-600">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                Awaiting Upload
            </span>
        );
    };

    const getPaymentModeText = (trade: TradeWithProduct) => {
        if (!trade.paymentMethod) return 'N/A';

        const { type, method, percentage } = trade.paymentMethod;
        if (type === 'advance' && percentage) {
            return `Advance (via ${method === 'RTGS' ? 'RTGS' : 'LC'}) ${percentage}%`;
        }
        if (type === 'credit') {
            return `Credit (via ${method === 'LetterOfCredit' ? 'LC' : method})`;
        }
        if (type === 'openAccount') {
            return 'Open Account';
        }
        return type || 'N/A';
    };

    const displayedTrades = trades.slice(0, entriesPerPage);

    // If a trade is selected for tracking, show the TrackTrade view
    if (selectedTradeId) {
        return (
            <div className="p-4">
                <button
                    onClick={() => setSelectedTradeId(null)}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                    <span className="rotate-180">→</span>
                    Back to list
                </button>
                <TrackTrade tradeId={selectedTradeId} isSeller={false} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="border-t-2 border-x-2 rounded-lg my-8 p-8">
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin mr-2" />
                    <span className="text-gray-500">Loading document status...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border-t-2 border-x-2 rounded-lg my-8 p-8">
                <div className="flex justify-center items-center h-40">
                    <span className="text-red-500">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="border-t-2 border-x-2 rounded-lg my-8">
            <div className="p-8 flex-col flex">
                <div className="flex">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-700"><TradeAbbreviation abbreviation="SPA" /> Document Status</h1>
                        <span className="text-gray-500">Review and manage Sales Purchase Agreement documents</span>
                    </div>
                    <Filter className="ml-auto cursor-pointer hover:text-gray-600" />
                </div>
                <div className="flex mt-8 items-center">
                    <SelectField
                        id="entries"
                        value={entriesPerPage}
                        className="select-field--sm w-fit"
                        onValueChange={(value) => setEntriesPerPage(Number(value))}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                    </SelectField>
                    <label className="ml-2 text-gray-500" htmlFor="entries">entries per page</label>
                </div>
            </div>

            {trades.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    No trades in document phase
                </div>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2">
                            <th className="text-gray-500 font-normal py-3 text-sm">Product name</th>
                            <th className="text-gray-500 font-normal py-3 text-sm">Seller name</th>
                            <th className="text-gray-500 font-normal py-3 text-sm">Mode of payment</th>
                            <th className="text-gray-500 font-normal py-3 text-sm">SPA Status</th>
                            <th className="text-gray-500 font-normal py-3 text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedTrades.map((trade) => (
                            <tr key={trade._id} className="border-b hover:bg-gray-50">
                                <td className="py-4 text-center">
                                    <span className="font-medium text-gray-800">
                                        {trade.product?.name || 'N/A'}
                                    </span>
                                </td>
                                <td className="py-4 text-center">
                                    <span className="text-gray-600">
                                        {trade.seller?.mail?.split('@')[0] || 'N/A'}
                                    </span>
                                </td>
                                <td className="py-4 text-center">
                                    <span className="text-gray-600">
                                        {getPaymentModeText(trade)}
                                    </span>
                                </td>
                                <td className="py-4 text-center">
                                    {getStatusBadge(trade)}
                                </td>
                                <td className="py-4 text-center">
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        <button
                                            onClick={() => handleTrack(trade._id)}
                                            className="px-4 py-1.5 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 text-sm"
                                        >
                                            Track
                                        </button>
                                        <button
                                            onClick={() => handleChat(trade.product._id)}
                                            disabled={chattingProductIds.has(trade.product._id)}
                                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                        >
                                            {chattingProductIds.has(trade.product._id) ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <MessageCircle className="w-3 h-3" />
                                            )}
                                            Chat
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default BuyerSPAStatus;
