import React, { useState, useEffect } from 'react';
import { Tabs, Table, TableRow } from '../../seller/trade';
import TradeHistorySearch from '../components/TradeHistorySearch';
import ProductCard from '../components/ProductCard';
import tradeService from '../../services/trade.service';
import productService from '../../services/product.service';
import authService from '../../services/auth.service';

interface Trade {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  product?: any;
  seller?: any;
  buyer?: any;
}

const HeadingDescription: React.FC<{ heading: string; description: string }> = ({ heading, description }) => {
  return (
    <div className='flex gap-2 flex-col my-2'>
      <h1 className='text-3xl font-extrabold'>{heading}</h1>
      <p className='text-gray-400'>{description}</p>
    </div>
  );
};

const BlueButton: React.FC<{ text: string; onClick?: () => void }> = ({ text, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className='border-[#0076D3] bg-transparent border-[1.5px] mx-3 text-black rounded-lg px-3 py-1 hover:bg-gray-50 transition-all duration-300 ease-in-out hover:scale-[1.03]'
    >
      {text}
    </button>
  );
};

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-400';
      case 'accepted': return 'bg-green-400';
      case 'rejected': 
      case 'declined': return 'bg-red-400';
      case 'expired': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${getStatusColor(status)} inline-block`}></span>
      <span className="text-gray-700">{getStatusText(status)}</span>
    </div>
  );
};

const PurchaseRequestStatus: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchaseRequests();
  }, []);

  const fetchPurchaseRequests = async () => {
    try {
      setLoading(true);
      const user = authService.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Get trade requests made by this buyer
      const response = await tradeService.getTradesByBuyer(user.id);
      if (response.success) {
        setTrades(response.trades || []);
      } else {
        setError(response.message || 'Failed to fetch trade requests');
      }
    } catch (error) {
      console.error('Error fetching trade requests:', error);
      setError('Failed to fetch trade requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAgain = async (tradeId: string) => {
    try {
      // Logic to resend trade request
      console.log('Resending trade request:', tradeId);
    } catch (error) {
      console.error('Error resending trade request:', error);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center py-16'>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex justify-center items-center py-16'>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <BlueButton text="Retry" onClick={fetchPurchaseRequests} />
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
        <HeadingDescription 
          heading='Purchase Requests' 
          description='Track your purchase requests to sellers' 
        />
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Purchase Requests Yet</h3>
          <p className="text-gray-600 mb-4">Start by browsing products and sending purchase requests to sellers.</p>
          <button
            onClick={() => window.location.href = '/buyer/homepage'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
      <div className='flex w-full justify-between'>
        <HeadingDescription 
          heading='Purchase Requests' 
          description='Track your purchase requests to sellers' 
        />
        <div className='flex gap-2 mt-auto mr-2 my-auto'>
          <BlueButton text='Filter' />
          <BlueButton text='Export CSV' />
        </div>
      </div>

      <Table
        headers={[
          'Request ID',
          'Product',
          'Seller',
          'Quantity',
          'Price',
          'Status',
          'Actions'
        ]}
        rows={trades.map(trade => (
          <TableRow
            key={trade.id}
            cells={[
              trade.id.substring(0, 8) + '...',
              <div className="flex items-center gap-2">
                <img 
                  src={trade.product?.images?.[0] || '/placeholder-product.svg'} 
                  alt={trade.product?.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <p className="font-medium text-sm">{trade.product?.name || 'Unknown Product'}</p>
                  <p className="text-xs text-gray-500">₹{trade.pricePerUnit.toLocaleString()} per unit</p>
                </div>
              </div>,
              <div>
                <p className="font-medium">{trade.seller?.firstName + ' ' + trade.seller?.lastName || 'Unknown Seller'}</p>
                <p className="text-xs text-gray-500">{trade.seller?.email || ''}</p>
              </div>,
              `${trade.quantity} units`,
              `₹${trade.totalAmount.toLocaleString()}`,
              <StatusIndicator status={trade.status} />,
              <div className="flex gap-2">
                {trade.status === 'pending' && (
                  <button className="text-blue-600 text-sm hover:underline">
                    Cancel
                  </button>
                )}
                {trade.status === 'rejected' && (
                  <button 
                    onClick={() => handleSendAgain(trade.id)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Send Again
                  </button>
                )}
                {trade.status === 'accepted' && (
                  <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                    Proceed to Pay
                  </button>
                )}
              </div>
            ]}
          />
        ))}
      />
    </div>
  );
};

const PurchaseOrderStatus: React.FC = () => {
  const [orders, setOrders] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const user = authService.getUser();
      if (!user) return;

      // Get accepted trades (purchase orders)
      const response = await tradeService.getTradesByBuyer(user.id, { status: 'accepted' });
      if (response.success) {
        setOrders(response.trades || []);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center py-16'>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
        <HeadingDescription 
          heading='Purchase Orders' 
          description='Your accepted purchase requests ready for payment' 
        />
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Purchase Orders</h3>
          <p className="text-gray-600">No purchase requests have been accepted yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
      <div className='flex w-full justify-between'>
        <HeadingDescription 
          heading='Purchase Orders' 
          description='Your accepted purchase requests ready for payment' 
        />
        <div className='flex gap-2 mt-auto mr-2 my-auto'>
          <BlueButton text='Filter' />
          <BlueButton text='Export CSV' />
        </div>
      </div>

      <Table
        headers={[
          'Order ID',
          'Product',
          'Seller',
          'Quantity',
          'Amount',
          'Status',
          'Payment'
        ]}
        rows={orders.map(order => (
          <TableRow
            key={order.id}
            cells={[
              order.id.substring(0, 8) + '...',
              <div className="flex items-center gap-2">
                <img 
                  src={order.product?.images?.[0] || '/placeholder-product.svg'} 
                  alt={order.product?.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <p className="font-medium text-sm">{order.product?.name || 'Unknown Product'}</p>
                  <p className="text-xs text-gray-500">₹{order.pricePerUnit.toLocaleString()} per unit</p>
                </div>
              </div>,
              <div>
                <p className="font-medium">{order.seller?.firstName + ' ' + order.seller?.lastName || 'Unknown Seller'}</p>
                <p className="text-xs text-gray-500">{order.seller?.email || ''}</p>
              </div>,
              `${order.quantity} units`,
              `₹${order.totalAmount.toLocaleString()}`,
              <StatusIndicator status={order.status} />,
              <button className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700">
                Pay Now
              </button>
            ]}
          />
        ))}
      />
    </div>
  );
};

const BuyAgain: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendedProducts();
  }, []);

  const fetchRecommendedProducts = async () => {
    try {
      const response = await productService.getFeaturedProducts(12);
      if (response.success) {
        setProducts(response.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <ProductCard key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-gray-400 text-6xl mb-4">🛍️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Available</h3>
        <p className="text-gray-600">Check back later for new products.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product: any) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

const Trade: React.FC = () => {
  const tabLabels = [
    { label: 'Purchase Request Status' },
    { label: 'Purchase Order Status' },
    { label: 'All Trades' },
    { label: 'Buy Again' }
  ];
  const [activeTab, setActiveTab] = React.useState(tabLabels[0].label);
  
  const handleTabChange = (tab: string): void => {
    setActiveTab(tab);
  };

  return (
    <div className="w-[98%] mx-auto text-lg p-8 bg-white rounded-xl shadow-lg">
      <TradeHistorySearch className="w-fit mx-auto my-8" />
      <Tabs
        tabs={tabLabels}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className='scale-110 !w-[88%]'
      />

      {/* Render tab content based on activeTab */}
      <div className="mt-4">
        {activeTab === 'Purchase Request Status' && <PurchaseRequestStatus />}
        {activeTab === 'Purchase Order Status' && <PurchaseOrderStatus />}
        {activeTab === 'All Trades' && <PurchaseRequestStatus />}
        {activeTab === 'Buy Again' && <BuyAgain />}
      </div>
    </div>
  );
};

export default Trade;