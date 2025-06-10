import React, { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, Star, MessageCircle, ThumbsUp, ThumbsDown, RefreshCw, Bell, Clock, DollarSign, User, Package, AlertTriangle } from "lucide-react";
import { tab } from '@testing-library/user-event/dist/tab';
import feedbackService, { ProductFeedbackSummary, Review as FeedbackReview } from '../services/feedback.service';
import authService from '../services/auth.service';
import tradeService, { TradeRequest, TradeFilters, TradeNotification, TradeStats } from '../services/trade.service';

// Trade component for the seller module
const Search: React.FC<{ onSearch: (term: string) => void }> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSearch} className='flex w-[80%] h-fit bg-white mx-2 rounded-lg p-3 shadow-md border-gray-300 border-[1px] transition-transform duration-300 ease-in-out hover:scale-[1.01]'>
      <SearchIcon className='mx-2' />
      <input 
        className='outline-none bg-transparent h-full w-full' 
        type="text" 
        placeholder='Search all your trades...'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </form>
  );
}

const RoundedButton: React.FC<Buttonprops> = ({ text, className = "" }) => {
  return (
    <button className={`bg-transparent shadow-md border-[1.2px] border-gray-300 text-black rounded-full px-4 py-2 hover:bg-gray-100 transition-all duration-300 ease-in-out hover:scale-[1.03] ${className}`}>
      {text}
    </button>
  );
}

const BlueButton: React.FC<{ text: string; onClick?: () => void; disabled?: boolean }> = ({ text, onClick, disabled }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`border-[#0076D3] bg-transparent border-[1.5px] mx-3 text-black rounded-lg px-3 py-1 hover:bg-gray-50 transition-all duration-300 ease-in-out hover:scale-[1.03] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {text}
    </button>
  );
}

type Buttonprops = {
  text: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const BlackButton: React.FC<Buttonprops> = ({ text, className = "", onClick, disabled }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`border-[black] bg-transparent border-[1.5px] mx-3 text-black rounded-lg px-3 py-1 hover:bg-gray-50 transition-all duration-300 ease-in-out hover:scale-[1.03] ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {text}
    </button>
  );
};

const RedButton: React.FC<{ text: string; onClick?: () => void; disabled?: boolean }> = ({ text, onClick, disabled }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`m-auto flex bg-red-400 px-3 py-1 rounded-md cursor-pointer hover:bg-red-500 transition-all duration-300 ease-in-out hover:scale-[1.03] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {text}
    </button>
  );
}

const GreenButton: React.FC<{ text: string; onClick?: () => void; disabled?: boolean }> = ({ text, onClick, disabled }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`m-auto flex bg-green-400 cursor-pointer px-3 py-1 rounded-md hover:bg-green-500 transition-all duration-300 ease-in-out hover:scale-[1.03] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {text}
    </button>
  );
};

const HeadingDescription: React.FC<{ heading: string; description: string }> = ({ heading, description }) => {
  return (
    <div className='flex gap-2 flex-col my-2'>
      <h1 className='text-3xl font-extrabold'>{heading}</h1>
      <p className='text-gray-400'>{description}</p>
    </div>
  );
}

const EntriesPerPage: React.FC<{ options: number[]; selected: number; onChange: (value: number) => void }> = ({ options, selected, onChange }) => {
  return (
    <div className="flex items-center gap-2 my-6">
      <select
        value={selected}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border-gray-300 border-[1px] rounded-md px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-gray-500 text-sm">entries per page</span>
    </div>
  );
};

const HorizontalLine: React.FC = () => {
  return (
    <div className='w-[98%] mx-auto h-[1.2px] rounded-full bg-gray-300 my-2' />
  );
}

const Tab: React.FC<{ label: string; isActive: boolean; onClick: () => void; className?: string; badge?: number }> = ({ label, isActive, onClick, className = "", badge }) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-all duration-300 ease-in-out relative ${isActive ? 'text-black border-b-[3px] font-extrabold text-4xl border-gray-300' : 'text-gray-400 text-2xl'
        } ${className}`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </div>
  );
};

const Tabs: React.FC<{ tabs: { label: string; badge?: number }[]; activeTab: string; onTabChange: (tab: string) => void; className?: string }> = ({ tabs, activeTab, onTabChange, className = "" }) => {
  return (
    <div className={`flex justify-center w-[98%] mx-auto border-b-[2px] border-gray-200 ${className}`}>
      {tabs.map((tab) => (
        <Tab
          key={tab.label}
          label={tab.label}
          badge={tab.badge}
          isActive={activeTab === tab.label}
          onClick={() => onTabChange(tab.label)}
        />
      ))}
    </div>
  );
};

const Table: React.FC<{ headers: string[]; rows: React.ReactNode[]; loading?: boolean }> = ({ headers, rows, loading }) => {
  return (
    <div className='w-[98%] mx-auto my-4 h-fit'>
      <table className='w-full border-collapse shadow-md border-[1.2px] border-gray-100'>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="p-3 border-b-2 border-gray-300 text-middle text-gray-600 font-semibold text-sm uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="p-8 text-center">
                <div className="flex items-center justify-center">
                  <RefreshCw className="animate-spin h-6 w-6 mr-2" />
                  Loading trades...
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="p-8 text-center text-gray-500">
                No trades found
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <React.Fragment key={index}>{row}</React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const TableRow: React.FC<{ cells: React.ReactNode[] }> = ({ cells }) => {
  return (
    <tr className="hover:bg-gray-50">
      {cells.map((cell, index) => (
        <td
          key={index}
          className="p-3 border-b-2 border-gray-300 text-center align-middle"
        >
          {cell}
        </td>
      ))}
    </tr>
  );
};

// New components for real trade management

const TradeStatusBadge: React.FC<{ status: string; urgent?: boolean }> = ({ status, urgent }) => {
  const statusColor = tradeService.getStatusColor(status);
  const urgentBadge = urgent ? tradeService.getUrgencyBadge(urgent) : '';
  
  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
      {urgent && (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${urgentBadge}`}>
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          URGENT
        </span>
      )}
    </div>
  );
};

const TradeDetailModal: React.FC<{ 
  trade: TradeRequest | null; 
  onClose: () => void; 
  onAccept: (id: string) => Promise<void>; 
  onReject: (id: string) => Promise<void>;
  onCounterOffer: (id: string, price: number, message: string) => Promise<void>;
}> = ({ trade, onClose, onAccept, onReject, onCounterOffer }) => {
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!trade) return null;

  const handleCounterOffer = async () => {
    if (!counterPrice || parseFloat(counterPrice) <= 0) return;
    
    setIsLoading(true);
    try {
      await onCounterOffer(trade.id, parseFloat(counterPrice), counterMessage);
      onClose();
    } catch (error) {
      console.error('Error making counter offer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept(trade.id);
      onClose();
    } catch (error) {
      console.error('Error accepting trade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(trade.id);
      onClose();
    } catch (error) {
      console.error('Error rejecting trade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Trade Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-semibold mb-2">Buyer Information</h3>
            <p><User className="inline w-4 h-4 mr-1" /> {trade.buyer?.firstName} {trade.buyer?.lastName}</p>
            <p className="text-sm text-gray-600">{trade.buyer?.email}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Product Information</h3>
            <p><Package className="inline w-4 h-4 mr-1" /> {trade.product?.name}</p>
            <p className="text-sm text-gray-600">Quantity: {trade.quantity}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Pricing</h3>
          <p><DollarSign className="inline w-4 h-4 mr-1" /> Offered: {tradeService.formatPrice(trade.offered_price)}</p>
          {trade.counter_offer_price && (
            <p><DollarSign className="inline w-4 h-4 mr-1" /> Counter Offer: {tradeService.formatPrice(trade.counter_offer_price)}</p>
          )}
          <p className="text-sm text-gray-600">Product Price: {tradeService.formatPrice(trade.product?.price || 0)}</p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Timeline</h3>
          <p><Clock className="inline w-4 h-4 mr-1" /> Created: {tradeService.formatDate(trade.created_at)}</p>
          {trade.expires_at && (
            <p><Clock className="inline w-4 h-4 mr-1" /> Expires: {tradeService.formatDate(trade.expires_at)}</p>
          )}
        </div>

        {trade.buyer_message && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Buyer Message</h3>
            <p className="bg-gray-100 p-3 rounded">{trade.buyer_message}</p>
          </div>
        )}

        {trade.status === 'pending' && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Make Counter Offer</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                placeholder="Counter offer price"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                className="border rounded px-3 py-2 flex-1"
              />
            </div>
            <textarea
              placeholder="Optional message"
              value={counterMessage}
              onChange={(e) => setCounterMessage(e.target.value)}
              className="border rounded px-3 py-2 w-full mb-2"
              rows={2}
            />
            <button
              onClick={handleCounterOffer}
              disabled={!counterPrice || isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Make Counter Offer
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {trade.status === 'pending' && (
            <>
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                Accept Trade
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                Reject Trade
              </button>
            </>
          )}
          <button onClick={onClose} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationToast: React.FC<{ 
  notification: TradeNotification | null; 
  onClose: () => void 
}> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 bg-white border-l-4 border-blue-500 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-sm">{notification.type.replace('_', ' ').toUpperCase()}</h4>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
    </div>
  );
};

const PurchaseRequestStatus: React.FC = () => {
  const [trades, setTrades] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<TradeRequest | null>(null);
  const [filters, setFilters] = useState<TradeFilters>({ 
    status: 'pending',
    page: 1, 
    limit: 10 
  });
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<TradeNotification | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Load trades data
  const loadTrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tradeService.getIncomingTrades(filters);
      console.log('🔍 Seller trades received:', response);
      console.log('🔍 First trade data:', response.trades[0]);
      if (response.trades[0]) {
        console.log('🔍 Offered price:', response.trades[0].offered_price);
        console.log('🔍 Product data:', response.trades[0].product);
        console.log('🔍 Buyer data:', response.trades[0].buyer);
      }
      setTrades(response.trades);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to load trades:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load trades',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // WebSocket setup
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await tradeService.connectWebSocket();
        
        // Listen for real-time updates
        tradeService.addEventListener('new-trade-request', (data: TradeNotification) => {
          setNotification(data);
          loadTrades(); // Refresh the list
        });

        tradeService.addEventListener('trade-status-update', (data: TradeNotification) => {
          setNotification(data);
          loadTrades(); // Refresh the list
        });

        tradeService.addEventListener('urgent-trade', (data: TradeNotification) => {
          setNotification(data);
          loadTrades(); // Refresh the list
        });

      } catch (error) {
        console.error('WebSocket connection failed:', error);
      }
    };

    connectWebSocket();
    loadTrades();

    return () => {
      tradeService.disconnectWebSocket();
    };
  }, [loadTrades]);

  const handleAcceptTrade = async (tradeId: string) => {
    try {
      await tradeService.acceptTrade(tradeId);
      loadTrades();
      setNotification({
        type: 'success',
        message: 'Trade accepted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to accept trade:', error);
      setNotification({
        type: 'error',
        message: 'Failed to accept trade',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleRejectTrade = async (tradeId: string) => {
    try {
      await tradeService.rejectTrade(tradeId, 'Declined by seller');
      loadTrades();
      setNotification({
        type: 'success',
        message: 'Trade rejected successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to reject trade:', error);
      setNotification({
        type: 'error',
        message: 'Failed to reject trade',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleCounterOffer = async (tradeId: string, price: number, message: string) => {
    try {
      await tradeService.makeCounterOffer(tradeId, {
        counter_offer_price: price,
        seller_message: message
      });
      loadTrades();
      setNotification({
        type: 'success',
        message: 'Counter offer sent successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send counter offer:', error);
      setNotification({
        type: 'error',
        message: 'Failed to send counter offer',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleBulkAccept = async () => {
    if (bulkSelected.size === 0) return;
    
    try {
      await tradeService.bulkAcceptTrades(Array.from(bulkSelected));
      setBulkSelected(new Set());
      loadTrades();
      setNotification({
        type: 'success',
        message: `Accepted ${bulkSelected.size} trades`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to bulk accept trades:', error);
      setNotification({
        type: 'error',
        message: 'Failed to bulk accept trades',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const toggleBulkSelect = (tradeId: string) => {
    const newSelected = new Set(bulkSelected);
    if (newSelected.has(tradeId)) {
      newSelected.delete(tradeId);
    } else {
      newSelected.add(tradeId);
    }
    setBulkSelected(newSelected);
  };

  return (
    <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
      <div className='flex w-full justify-between'>
        <HeadingDescription 
          heading='Purchase Request Status' 
          description='Manage incoming trade requests from buyers' 
        />
        <div className='flex gap-2 mt-auto mr-2 my-auto'>
          {bulkSelected.size > 0 && (
            <BlueButton text={`Bulk Accept (${bulkSelected.size})`} onClick={handleBulkAccept} />
          )}
          <BlueButton text='Filter' />
          <BlueButton text='Export CSV' />
          <BlueButton text='Refresh' onClick={loadTrades} />
        </div>
      </div>

      <EntriesPerPage
        options={[5, 10, 20, 50]}
        selected={filters.limit || 10}
        onChange={(value) => setFilters(prev => ({ ...prev, limit: value, page: 1 }))}
      />

      <Table
        headers={['Select', 'ID', 'Buyer', 'Product', 'Offered Price', 'Quantity', 'Status', 'Created', 'Actions']}
        loading={loading}
        rows={trades.map((trade) => (
          <TableRow 
            key={trade.id}
            cells={[
              <input
                type="checkbox"
                checked={bulkSelected.has(trade.id)}
                onChange={() => toggleBulkSelect(trade.id)}
                disabled={trade.status !== 'pending'}
              />,
              <span className="font-mono text-xs">{trade.id.substring(0, 8)}...</span>,
              <div className="text-left">
                <div className="font-medium">{trade.buyer?.firstName} {trade.buyer?.lastName}</div>
                <div className="text-sm text-gray-500">{trade.buyer?.email}</div>
              </div>,
              <div className="text-left">
                <div className="font-medium">{trade.product?.name}</div>
                <div className="text-sm text-gray-500">Stock: {trade.product?.quantity}</div>
              </div>,
              <div className="text-right">
                <div className="font-bold">{tradeService.formatPrice(trade.offered_price)}</div>
                {trade.counter_offer_price && (
                  <div className="text-sm text-blue-600">Counter: {tradeService.formatPrice(trade.counter_offer_price)}</div>
                )}
              </div>,
              trade.quantity,
              <TradeStatusBadge status={trade.status} urgent={trade.is_urgent} />,
              tradeService.formatDate(trade.created_at),
              <div className='flex gap-1'>
                <button
                  onClick={() => setSelectedTrade(trade)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                >
                  View
                </button>
                {trade.status === 'pending' && (
                  <>
                    <GreenButton 
                      text="Accept" 
                      onClick={() => handleAcceptTrade(trade.id)}
                    />
                    <RedButton 
                      text="Decline" 
                      onClick={() => handleRejectTrade(trade.id)}
                    />
                  </>
                )}
              </div>
            ]} 
          />
        ))}
      />

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
          disabled={currentPage <= 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-1">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Trade Detail Modal */}
      <TradeDetailModal
        trade={selectedTrade}
        onClose={() => setSelectedTrade(null)}
        onAccept={handleAcceptTrade}
        onReject={handleRejectTrade}
        onCounterOffer={handleCounterOffer}
      />

      {/* Notification Toast */}
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}

const PurchaseOrder: React.FC = () => {
  return (
    <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
      <div className='flex w-full justify-between'>
        <HeadingDescription heading='Purchase Orders' description='Manage your confirmed purchase orders' />
        <div className='flex gap-2 mt-auto mr-2 my-auto'>
          <BlueButton text='Filter' />
          <BlueButton text='Export CSV' />
        </div>
      </div>

      <EntriesPerPage
        options={[5, 10, 20, 50]}
        selected={10}
        onChange={(value) => console.log("Selected entries per page:", value)}
      />

      <div className="flex flex-col items-center justify-center py-16">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-500 mb-2">No Purchase Orders Yet</h3>
        <p className="text-gray-400 text-center max-w-md">
          Once buyers accept your trade offers and confirm their orders, they will appear here. 
          You can track order status, shipping details, and manage fulfillment.
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> To get your first orders, make sure your trade offers are competitive and respond quickly to buyer requests!
          </p>
        </div>
      </div>
    </div>
  );
}

const OngoingTrades: React.FC = () => {
  return (
    <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
      <div className='flex w-full justify-between'>
        <HeadingDescription heading='Ongoing Trades' description='Track your active trades and shipments' />
        <div className='flex gap-2 mt-auto mr-2 my-auto'>
          <BlueButton text='Filter' />
          <BlueButton text='Export CSV' />
        </div>
      </div>

      <EntriesPerPage
        options={[5, 10, 20, 50]}
        selected={10}
        onChange={(value) => console.log("Selected entries per page:", value)}
      />

      <div className="flex flex-col items-center justify-center py-16">
        <Clock className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-500 mb-2">No Ongoing Trades</h3>
        <p className="text-gray-400 text-center max-w-md">
          Active trades that are in progress, awaiting payment, or being shipped will appear here. 
          You can monitor delivery status and communicate with buyers.
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              ✅ <strong>Accepted:</strong> Trades you've accepted
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">
              🚚 <strong>Shipped:</strong> Orders in transit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const TradeHistory: React.FC = () => {
  return (
    <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
      <div className='flex w-full justify-between mb-6'>
        <HeadingDescription heading='Trade History' description='View your completed trade transactions' />
        <div className='flex gap-2 mt-auto mr-2 my-auto'>
          <BlueButton text='Filter' />
          <BlueButton text='Export CSV' />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative mb-6">
          <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="h-10 w-10 text-gray-400" />
          </div>
          <div className="absolute -top-1 -right-1 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Clock className="h-3 w-3 text-white" />
          </div>
        </div>
        
        <h3 className="text-2xl font-semibold text-gray-500 mb-3">No Trade History Yet</h3>
        <p className="text-gray-400 text-center max-w-lg mb-8">
          Your completed trades, delivered orders, and transaction history will appear here. 
          This includes successful sales, customer feedback, and payment records.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
            <DollarSign className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h4 className="font-semibold text-purple-700 mb-1">Completed Sales</h4>
            <p className="text-sm text-purple-600">Track your revenue</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <Star className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h4 className="font-semibold text-green-700 mb-1">Customer Reviews</h4>
            <p className="text-sm text-green-600">Build your reputation</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
            <User className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h4 className="font-semibold text-blue-700 mb-1">Buyer Relationships</h4>
            <p className="text-sm text-blue-600">Repeat customers</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
          <p className="text-sm text-gray-600 text-center">
            🎯 <strong>Get Started:</strong> Accept trade requests to build your transaction history and grow your business!
          </p>
        </div>
      </div>
    </div>
  );
}

const TrackTrade: React.FC<{ orders?: React.ReactNode[] }> = ({ orders = [] }) => {
  return (
    <div className='flex flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg bg-white'>
      <div className='flex border-b-[2px] border-gray-300 px-6 py-4 bg-white'>
        <h1 className='text-3xl font-semibold'>Trade Tracking</h1>
      </div>
      
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative mb-6">
          <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="h-10 w-10 text-gray-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
        </div>
        
        <h3 className="text-2xl font-semibold text-gray-500 mb-3">No Shipments to Track</h3>
        <p className="text-gray-400 text-center max-w-lg mb-8">
          Once you ship orders to customers, tracking information will appear here. 
          Monitor delivery status, update shipment details, and keep buyers informed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
          <div className="p-6 bg-orange-50 rounded-lg border border-orange-200 text-center">
            <div className="h-12 w-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-6a1 1 0 00-1-1h-3z"/>
              </svg>
            </div>
            <h4 className="font-semibold text-orange-700 mb-2">In Transit</h4>
            <p className="text-sm text-orange-600">Real-time tracking updates</p>
          </div>
          
          <div className="p-6 bg-green-50 rounded-lg border border-green-200 text-center">
            <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h4 className="font-semibold text-green-700 mb-2">Delivered</h4>
            <p className="text-sm text-green-600">Successful deliveries</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md">
          <p className="text-sm text-blue-700 text-center">
            📦 <strong>Coming Soon:</strong> Integration with major shipping carriers for automatic tracking updates!
          </p>
        </div>
      </div>
    </div>
  );
}

type RatingsProps = {
  reviews: number[]; // Array of review counts for [5, 4, 3, 2, 1] stars
};

const Ratings: React.FC<{ product: ProductFeedbackSummary | null }> = ({ product }) => {
  if (!product) return (
    <div className="flex flex-col items-start w-full p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Feedback Summary</h2>
      <div className="flex flex-col gap-2 w-full mb-6">
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="flex items-center gap-2">
            <span className="font-semibold">{star}</span>
            <Star className="h-4 w-4 text-gray-300" />
            <div className="relative flex-1 h-3 bg-gray-100 rounded">
              <div className="absolute left-0 top-0 h-3 bg-gray-200 rounded" style={{ width: '0%' }} />
            </div>
            <span className="ml-2 text-gray-500 text-xs">0</span>
          </div>
        ))}
      </div>
      <div className="flex items-center mt-2">
        <span className="font-bold text-xl mr-2">Average Rating :</span>
        <span className="font-bold text-xl mr-2">0.0</span>
        <Star className="h-6 w-6 text-gray-300" />
      </div>
    </div>
  );

  // If product exists but has no reviews
  if (product.reviewCount === 0) {
    return (
      <div className="flex flex-col items-start w-full p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Feedback Summary</h2>
        <div className="flex flex-col items-center justify-center w-full py-8">
          <Star className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No ratings yet</p>
          <p className="text-gray-400 text-sm mt-2">This product hasn't received any ratings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start w-full p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Feedback Summary</h2>
      <div className="flex flex-col gap-2 w-full mb-6">
        {[5, 4, 3, 2, 1].map((star, idx) => {
          const count = product.starCounts ? product.starCounts[idx] : 0;
          const percent = product.reviewCount === 0 ? 0 : (count / product.reviewCount) * 100;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="font-semibold">{star}</span>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <div className="relative flex-1 h-3 bg-yellow-100 rounded">
                <div
                  className="absolute left-0 top-0 h-3 bg-yellow-400 rounded"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="ml-2 text-gray-500 text-xs">{count}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center mt-2">
        <span className="font-bold text-xl mr-2">Average Rating :</span>
        <span className="font-bold text-xl mr-2">{product.averageRating.toFixed(1)}</span>
        <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
      </div>
      <p className="mt-4 text-sm text-gray-600">
        Based on {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
      </p>
    </div>
  );
};

type ProductNameProps = {
  name: string;
};

const ProductName: React.FC<{ product: ProductFeedbackSummary | null }> = ({ product }) => {
  if (!product) return (
    <div className="flex flex-col w-full p-6 bg-white rounded-lg shadow-md border border-gray-200 my-6">
      <h2 className="text-2xl font-bold mb-4">Select a product</h2>
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-xl border-2 border-gray-200 mb-6">
        <p className="text-gray-500">Please select a product from the dropdown above</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full p-6 bg-white rounded-lg shadow-md border border-gray-200 my-6">
      <h2 className="text-2xl font-bold mb-4">{product.productName}</h2>
      {product.productImage ? (
        <img 
          src={product.productImage} 
          alt={product.productName}
          className="w-full h-48 object-contain rounded-xl border-2 border-blue-400 mb-6"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-xl border-2 border-gray-300 mb-6">
          <p className="text-gray-500">No image available</p>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-700">{product.productDescription || 'No description available'}</p>
      </div>
    </div>
  );
};

type Review = {
  user: string;
  date: string;
  content: string;
};

type ProductReviewsProps = {
  reviews: Review[];
  total: number;
  max: number;
};

const ProductReviews: React.FC<{ product: ProductFeedbackSummary | null, onRefresh: () => void }> = ({ product, onRefresh }) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    
    setIsSubmitting(true);
    try {
      const success = await feedbackService.replyToReview(reviewId, replyText);
      if (success) {
        setReplyText('');
        setReplyingTo(null);
        onRefresh(); // Refresh the reviews
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!product) return (
    <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-6 my-6 h-[96%] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Product Reviews</h2>
        <button 
          onClick={onRefresh}
          className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>
      <div className="flex flex-col gap-4 items-center justify-center py-10">
        <p className="text-gray-500">Select a product to view reviews</p>
      </div>
    </div>
  );

  const reviews = product.reviews || [];
  
  return (
    <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-6 my-6 h-[96%] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Product Reviews</h2>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">{reviews.length} reviews</span>
          <button 
            onClick={onRefresh}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <MessageCircle className="h-10 w-10 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No reviews yet</p>
          <p className="text-gray-400 text-sm mt-2">This product hasn't received any reviews</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="flex flex-col bg-gray-50 rounded-lg p-4">
              <div className="flex items-start mb-3">
                {review.userAvatar ? (
                  <img 
                    src={review.userAvatar} 
                    alt={review.userName}
                    className="w-10 h-10 rounded-full mr-4 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 mr-4 flex items-center justify-center">
                    <span className="font-bold text-white text-sm">
                      {review.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
            <div>
                      <h4 className="font-semibold">{review.userName}</h4>
                      <div className="flex items-center">
                        {Array(5).fill(0).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                          />
                        ))}
                        <span className="text-gray-500 text-xs ml-2">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <ThumbsUp className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">{review.helpful}</span>
                      </div>
                      <div className="flex items-center">
                        <ThumbsDown className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">{review.notHelpful}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 mt-2">{review.content}</p>
                  
                  {/* Review images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {review.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={`Review ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded border border-gray-200"
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Reply section */}
                  <div className="mt-4">
                    {replyingTo === review.id ? (
                      <div className="mt-2">
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Write your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end mt-2 gap-2">
                          <button
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                            onClick={() => handleSubmitReply(review.id)}
                            disabled={isSubmitting || !replyText.trim()}
                          >
                            {isSubmitting ? 'Sending...' : 'Reply'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="text-blue-500 text-sm hover:text-blue-700"
                        onClick={() => setReplyingTo(review.id)}
                      >
                        Reply to this review
                      </button>
                    )}
                  </div>
                </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

const Feedback: React.FC = () => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductFeedbackSummary[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductFeedbackSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch seller's products with feedback on mount
  useEffect(() => {
    fetchProductsFeedback();
  }, []);

  // Fetch product feedback when a product is selected
  useEffect(() => {
    if (selectedProductId) {
      fetchProductFeedback(selectedProductId);
    } else {
      setSelectedProduct(null);
    }
  }, [selectedProductId]);

  const fetchProductsFeedback = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const productsData = await feedbackService.getSellerProductsFeedback();
      setProducts(productsData);
      
      // Select the first product by default if available
      if (productsData.length > 0 && !selectedProductId) {
        setSelectedProductId(productsData[0].productId);
        setSelectedProduct(productsData[0]);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching products feedback:', error);
      setError('Failed to load product feedback. Please try again.');
      setIsLoading(false);
    }
  };

  const fetchProductFeedback = async (productId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const productData = await feedbackService.getProductFeedback(productId);
      if (productData) {
        setSelectedProduct(productData);
      } else {
        setError('Failed to load product details');
      }
    } catch (error) {
      console.error('Error fetching product feedback:', error);
      setError('Failed to load product feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedProductId) {
      fetchProductFeedback(selectedProductId);
    } else {
      fetchProductsFeedback();
    }
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId === "" ? null : productId);
    setDropdownOpen(false);
  };

  return (
    <div className="w-full max-w-6xl mt-12 mb-8 mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Product Feedback</h1>
        <div className="flex items-center gap-4">
          {/* Custom dropdown */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between min-w-[200px]"
              disabled={isLoading && products.length === 0}
            >
              <span className="text-gray-800">
                {selectedProduct ? selectedProduct.productName : 'Select a product'}
              </span>
              <svg className={`w-4 h-4 ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="py-1">
                  <button
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    onClick={() => handleProductChange("")}
                  >
                    Select a product
                  </button>
                  {products.map((product) => (
                    <button
                      key={product.productId}
                      className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        selectedProductId === product.productId ? 'bg-gray-200' : ''
                      }`}
                      onClick={() => handleProductChange(product.productId)}
                    >
                      {product.productName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleRefresh}
            className="p-2 text-blue-500 hover:text-blue-700 focus:outline-none"
            disabled={isLoading}
            aria-label="Refresh feedback data"
            title="Refresh feedback data"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {isLoading && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-md">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-500 mb-4" />
          <p className="text-gray-500 text-lg">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg">No products available</p>
          <p className="text-gray-400 text-sm mt-2">Add some products to see feedback</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 min-w-[340px] max-w-[420px]">
            <ProductName product={selectedProduct} />
            <Ratings product={selectedProduct} />
      </div>
      <div className="flex-1 min-w-[340px] max-w-[600px]">
            <ProductReviews product={selectedProduct} onRefresh={handleRefresh} />
          </div>
      </div>
      )}
    </div>
  );
};

// Main Trade component
const Trade: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('Purchase Request Status');
  const [tradeStats, setTradeStats] = useState<TradeStats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await tradeService.getTradeStats();
        setTradeStats(stats);
      } catch (error) {
        console.error('Failed to load trade stats:', error);
      }
    };

    loadStats();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    console.log("Selected tab:", tab);
  };

  const handleSearch = (searchTerm: string) => {
    console.log("Searching for:", searchTerm);
    // This will be handled by the PurchaseRequestStatus component
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'Purchase Request Status':
        return <PurchaseRequestStatus />;
      case 'Purchase Order':
        return <PurchaseOrder />;
      case 'Ongoing Trades':
        return <OngoingTrades />;
      case 'Track Trade':
        return <TrackTrade />;
      case 'Trade History':
        return <TradeHistory />;
      default:
        return null;
    }
  };

  const tabs = [
    { label: 'Purchase Request Status', badge: tradeStats?.pending },
    { label: 'Purchase Order', badge: tradeStats?.accepted },
    { label: 'Ongoing Trades' },
    { label: 'Track Trade' },
    { label: 'Trade History' }
  ];

  return (
    <div className='w-[95%] mx-auto my-4 h-fit flex flex-col'>
      <div className='flex w-[98%] mx-auto my-12'>
        <Search onSearch={handleSearch} />
        <RoundedButton className='mx-6' text='Search Trades' />
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {renderActiveTabContent()}
    </div>
  );
};

export{Trade,Tabs,Table,TableRow,PurchaseRequestStatus,PurchaseOrder,OngoingTrades,TrackTrade,Ratings,ProductName,ProductReviews,Feedback};