import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Filter, MessageCircle, Loader2 } from "lucide-react";
import { getUserTrades, Trade, TradePhase, PaymentMethod } from "../../services/trade.service";
import { createConversation } from "../../services/inbox.service";
import TrackTrade from "../../components/TrackTrade";

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
}

// Document phases to filter for
const DOCUMENT_PHASES: TradePhase[] = ['SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL'];

export const BuyerSPAStatus: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tradeIdParam = searchParams.get('tradeId');

    const [trades, setTrades] = useState<TradeWithProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [entriesPerPage, setEntriesPerPage] = useState(5);
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(tradeIdParam);
    const [chattingProductId, setChattingProductId] = useState<string | null>(null);

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
        try {
            setChattingProductId(productId);
            const result = await createConversation(productId);
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
            console.error("Error creating conversation:", error);
            alert('Error creating conversation');
        } finally {
            setChattingProductId(null);
        }
    };

    const handleTrack = (tradeId: string) => {
        setSelectedTradeId(tradeId);
    };

    const getStatusBadge = (trade: TradeWithProduct) => {
        const phase = trade.tradePhase;

        // Check if we're waiting for the other party or if document is received
        if (phase === 'BOL') {
            return (
                <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    Received
                </span>
            );
        }
        if (phase === 'PAYMENT') {
            return (
                <span className="flex items-center gap-1 text-yellow-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    Pending
                </span>
            );
        }
        if (phase === 'SPA') {
            return (
                <span className="flex items-center gap-1 text-yellow-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    Pending
                </span>
            );
        }
        if (phase === 'ICPO') {
            return (
                <span className="flex items-center gap-1 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    In Progress
                </span>
            );
        }
        if (phase === 'SCO') {
            return (
                <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    Received
                </span>
            );
        }

        return (
            <span className="flex items-center gap-1 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                Unknown
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
                        <h1 className="text-2xl font-bold text-gray-700">Ongoing trade</h1>
                        <span className="text-gray-500">Check whether the things are legit using bill of lading</span>
                    </div>
                    <Filter className="ml-auto cursor-pointer hover:text-gray-600" />
                </div>
                <div className="flex mt-8 items-center">
                    <select
                        id="entries"
                        className="w-fit bg-white border-2 rounded-lg px-2 py-1"
                        value={entriesPerPage}
                        onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                    </select>
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
                            <th className="text-gray-500 font-normal py-3 text-sm">Bill of lading status</th>
                            <th className="text-gray-500 font-normal py-3 text-sm">Bill of lading</th>
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
                                    {trade.tradePhase === 'BOL' ? (
                                        <button
                                            onClick={() => handleTrack(trade._id)}
                                            className="px-4 py-1.5 border border-gray-800 text-gray-800 rounded hover:bg-gray-100 text-sm"
                                        >
                                            Verify
                                        </button>
                                    ) : trade.tradePhase === 'SCO' || trade.tradePhase === 'ICPO' || trade.tradePhase === 'SPA' || trade.tradePhase === 'PAYMENT' ? (
                                        <button
                                            onClick={() => handleTrack(trade._id)}
                                            className="px-4 py-1.5 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 text-sm"
                                        >
                                            Track
                                        </button>
                                    ) : (
                                        <span className="text-gray-400">---------</span>
                                    )}
                                    {/* Show chat option for any issues */}
                                    {trade.tradePhase && (
                                        <button
                                            onClick={() => handleChat(trade.product._id)}
                                            disabled={chattingProductId === trade.product._id}
                                            className="ml-2 text-blue-600 hover:underline text-sm flex items-center gap-1 inline-flex"
                                        >
                                            {chattingProductId === trade.product._id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <MessageCircle className="w-3 h-3" />
                                            )}
                                            Chat with seller
                                        </button>
                                    )}
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
