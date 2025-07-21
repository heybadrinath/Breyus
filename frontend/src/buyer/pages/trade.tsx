import React, { useState, useEffect } from 'react';
// import { Tabs, Table, TableRow } from '../../seller/trade';
// import TradeHistorySearch from '../components/TradeHistorySearch';
// import ProductCard from '../components/ProductCard';
// import tradeService from '../../services_old/trade.service';
// import productService from '../../services_old/product.service';
// import authService from '../../services_old/auth.service';
// import { useNavigate } from 'react-router-dom';
// import Image from '../../components/Image';

// interface Trade {
//   id: string;
//   buyer_id: string;
//   seller_id: string;
//   product_id: string;
//   quantity: number;
//   offered_price: number;
//   counter_offer_price?: number;
//   status: 'pending' | 'accepted' | 'rejected' | 'counter_offered' | 'expired' | 'completed' | 'cancelled';
//   trade_type: 'purchase_request' | 'bulk_order' | 'spot_trade' | 'contract_trade';
//   buyer_message?: string;
//   seller_message?: string;
//   rejection_reason?: string;
//   trade_terms?: any;
//   shipping_details?: any;
//   expires_at?: string;
//   accepted_at?: string;
//   completed_at?: string;
//   final_price?: number;
//   is_urgent: boolean;
//   counter_offer_count: number;
//   created_at: string;
//   updated_at: string;
//   product?: any;
//   seller?: any;
//   buyer?: any;
//   // Legacy fields for backward compatibility
//   buyerId?: string;
//   sellerId?: string;
//   productId?: string;
//   pricePerUnit?: number;
//   totalAmount?: number;
//   type?: string;
//   createdAt?: string;
//   updatedAt?: string;
//   expiresAt?: string;
// }

// const HeadingDescription: React.FC<{ heading: string; description: string }> = ({ heading, description }) => {
//   return (
//     <div className='flex gap-2 flex-col my-2'>
//       <h1 className='text-3xl font-extrabold'>{heading}</h1>
//       <p className='text-gray-400'>{description}</p>
//     </div>
//   );
// };

// const BlueButton: React.FC<{ text: string; onClick?: () => void }> = ({ text, onClick }) => {
//   return (
//     <button 
//       onClick={onClick}
//       className='border-[#0076D3] bg-transparent border-[1.5px] mx-3 text-black rounded-lg px-3 py-1 hover:bg-gray-50 transition-all duration-300 ease-in-out hover:scale-[1.03]'
//     >
//       {text}
//     </button>
//   );
// };

// const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'pending': return 'bg-yellow-400';
//       case 'accepted': return 'bg-green-400';
//       case 'rejected': 
//       case 'declined': return 'bg-red-400';
//       case 'expired': return 'bg-gray-400';
//       default: return 'bg-gray-400';
//     }
//   };

//   const getStatusText = (status: string) => {
//     return status.charAt(0).toUpperCase() + status.slice(1);
//   };

//   return (
//     <div className="flex items-center gap-2">
//       <span className={`w-3 h-3 rounded-full ${getStatusColor(status)} inline-block`}></span>
//       <span className="text-gray-700">{getStatusText(status)}</span>
//     </div>
//   );
// };

// const PurchaseRequestStatus: React.FC = () => {
//   const [trades, setTrades] = useState<Trade[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [loadingDetails, setLoadingDetails] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchPurchaseRequests();
//   }, []);

//   const fetchPurchaseRequests = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const user = authService.getUser();
//       if (!user) {
//         setError('User not authenticated');
//         return;
//       }

//       console.log('Fetching trades for user:', user.id);
      
//       // Get trade requests made by this buyer
//       const response = await tradeService.getTradesByBuyer(user.id);
//       console.log('Trade response received:', response);
      
//       if (response.success) {
//         const trades = response.trades || [];
//         console.log('Trades data:', trades);
//         setTrades(trades);
        
//         if (trades.length === 0) {
//           console.log('No trades found for user');
//         }
//       } else {
//         setError(response.message || 'Failed to fetch trade requests');
//         console.error('Trade fetch failed:', response.message);
//       }
//     } catch (error) {
//       console.error('Error fetching trade requests:', error);
//       setError('Failed to fetch trade requests. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewDetails = async (tradeId: string) => {
//     try {
//       setLoadingDetails(true);
//       const tradeDetails = await tradeService.getTradeDetails(tradeId);
//       setSelectedTrade(tradeDetails);
//       setIsModalOpen(true);
//     } catch (error) {
//       console.error('Error fetching trade details:', error);
//       alert('Failed to load trade details. Please try again.');
//     } finally {
//       setLoadingDetails(false);
//     }
//   };

//   const handleSendAgain = async (trade: Trade) => {
//     try {
//       // Navigate to purchase request page with pre-filled data
//       // Store the trade data in sessionStorage for the purchase request form
//       const tradeData = {
//         productId: trade.product_id || trade.productId,
//         sellerId: trade.seller_id || trade.sellerId,
//         quantity: trade.quantity,
//         offeredPrice: trade.offered_price,
//         message: trade.buyer_message,
//         product: trade.product,
//         seller: trade.seller
//       };
      
//       sessionStorage.setItem('resendTradeData', JSON.stringify(tradeData));
      
//       // Navigate to the product page or purchase request page
//       // You can modify this path based on your routing structure
//       const productId = trade.product_id || trade.productId;
//       if (productId) {
//         navigate(`/buyer/product-request-quantity?productId=${encodeURIComponent(productId)}&resend=true`);
//       } else {
//         alert('Product information not available for resending.');
//       }
//     } catch (error) {
//       console.error('Error preparing to resend trade request:', error);
//       alert('Failed to prepare resend. Please try again.');
//     }
//   };

//   const handleProceedToPay = (trade: Trade) => {
//     // Navigate to payment page with trade details
//     const paymentData = {
//       tradeId: trade.id,
//       amount: (trade.counter_offer_price || trade.offered_price || 0) * trade.quantity,
//       productName: trade.product?.name,
//       quantity: trade.quantity,
//       pricePerUnit: trade.counter_offer_price || trade.offered_price,
//       sellerId: trade.seller_id || trade.sellerId,
//       productId: trade.product_id || trade.productId
//     };
    
//     sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
//     navigate('/buyer/payment', { state: { paymentData } });
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setSelectedTrade(null);
//   };

//   if (loading) {
//     return (
//       <div className='flex justify-center items-center py-16'>
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className='flex justify-center items-center py-16'>
//         <div className="text-center">
//           <p className="text-red-600 mb-4">{error}</p>
//           <BlueButton text="Retry" onClick={fetchPurchaseRequests} />
//         </div>
//       </div>
//     );
//   }

//   if (trades.length === 0) {
//     return (
//       <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
//         <HeadingDescription 
//           heading='Purchase Requests' 
//           description='Track your purchase requests to sellers' 
//         />
//         <div className="flex flex-col items-center justify-center py-16">
//           <div className="text-gray-400 text-6xl mb-4">📋</div>
//           <h3 className="text-xl font-semibold text-gray-900 mb-2">No Purchase Requests Yet</h3>
//           <p className="text-gray-600 mb-4">Start by browsing products and sending purchase requests to sellers.</p>
//           <button
//             onClick={() => window.location.href = '/buyer/homepage'}
//             className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             Browse Products
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
//         <div className='flex w-full justify-between'>
//           <HeadingDescription 
//             heading='Purchase Requests' 
//             description='Track your purchase requests to sellers' 
//           />
//           <div className='flex gap-2 mt-auto mr-2 my-auto'>
//             <BlueButton text='Filter' />
//             <BlueButton text='Export CSV' />
//           </div>
//         </div>

//         <Table
//           headers={[
//             'Request ID',
//             'Product',
//             'Seller',
//             'Quantity',
//             'Price',
//             'Status',
//             'Actions'
//           ]}
//           rows={trades.map(trade => (
//             <TableRow
//               key={trade.id}
//               cells={[
//                 trade.id.substring(0, 8) + '...',
//                 <div className="flex items-center gap-2">
//                   <Image 
//                     src={trade.product?.productImage} 
//                     alt={trade.product?.name || 'Product'} 
//                     className="w-12 h-12 object-cover rounded"
//                   />
//                   <div>
//                     <p className="font-medium text-sm">{trade.product?.name || 'Unknown Product'}</p>
//                     <p className="text-xs text-gray-500">₹{(trade.offered_price || 0).toLocaleString()} per unit</p>
//                     {trade.counter_offer_price && (
//                       <p className="text-xs text-blue-600">Counter: ₹{trade.counter_offer_price.toLocaleString()}</p>
//                     )}
//                   </div>
//                 </div>,
//                 <div>
//                   <p className="font-medium">
//                     {trade.seller?.firstName && trade.seller?.lastName 
//                       ? `${trade.seller.firstName} ${trade.seller.lastName}` 
//                       : 'Unknown Seller'}
//                   </p>
//                   <p className="text-xs text-gray-500">{trade.seller?.email || ''}</p>
//                 </div>,
//                 `${trade.quantity} units`,
//                 `₹${((trade.counter_offer_price || trade.offered_price || 0) * trade.quantity).toLocaleString()}`,
//                 <StatusIndicator status={trade.status} />,
//                 <div className="flex gap-2 flex-wrap">
//                   {trade.status === 'pending' && (
//                     <button 
//                       onClick={() => {/* TODO: Implement cancel */}}
//                       className="text-red-600 text-sm hover:underline"
//                     >
//                       Cancel
//                     </button>
//                   )}
//                   {(trade.status === 'rejected' || trade.status === 'expired') && (
//                     <button 
//                       onClick={() => handleSendAgain(trade)}
//                       className="text-blue-600 text-sm hover:underline font-medium"
//                     >
//                       Send Again
//                     </button>
//                   )}
//                   {(trade.status === 'accepted' || trade.status === 'counter_offered') && (
//                     <button 
//                       onClick={() => handleProceedToPay(trade)}
//                       className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
//                     >
//                       Proceed to Pay
//                     </button>
//                   )}
//                   <button 
//                     onClick={() => handleViewDetails(trade.id)}
//                     disabled={loadingDetails}
//                     className="text-blue-600 text-sm hover:underline font-medium disabled:opacity-50"
//                   >
//                     {loadingDetails ? 'Loading...' : 'View Details'}
//                   </button>
//                 </div>
//               ]}
//             />
//           ))}
//         />
//       </div>

//       {/* Trade Details Modal */}
//       <TradeDetailsModal
//         trade={selectedTrade}
//         isOpen={isModalOpen}
//         onClose={closeModal}
//         onProceedToPay={handleProceedToPay}
//       />
//     </>
//   );
// };

// const PurchaseOrderStatus: React.FC = () => {
//   const [orders, setOrders] = useState<Trade[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [loadingDetails, setLoadingDetails] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchPurchaseOrders();
//   }, []);

//   const fetchPurchaseOrders = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const user = authService.getUser();
//       if (!user) {
//         setError('User not authenticated');
//         return;
//       }

//       // Get accepted trades (purchase orders)
//       const response = await tradeService.getTradesByBuyer(user.id, { status: 'accepted' });
//       if (response.success) {
//         setOrders(response.trades || []);
//       } else {
//         setError(response.message || 'Failed to fetch purchase orders');
//       }
//     } catch (error) {
//       console.error('Error fetching purchase orders:', error);
//       setError('Failed to fetch purchase orders. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewDetails = async (tradeId: string) => {
//     try {
//       setLoadingDetails(true);
//       const tradeDetails = await tradeService.getTradeDetails(tradeId);
//       setSelectedTrade(tradeDetails);
//       setIsModalOpen(true);
//     } catch (error) {
//       console.error('Error fetching trade details:', error);
//       alert('Failed to load trade details. Please try again.');
//     } finally {
//       setLoadingDetails(false);
//     }
//   };

//   const handleProceedToPay = (trade: Trade) => {
//     // Navigate to payment page with trade details
//     const paymentData = {
//       tradeId: trade.id,
//       amount: (trade.counter_offer_price || trade.offered_price || 0) * trade.quantity,
//       productName: trade.product?.name,
//       quantity: trade.quantity,
//       pricePerUnit: trade.counter_offer_price || trade.offered_price,
//       sellerId: trade.seller_id || trade.sellerId,
//       productId: trade.product_id || trade.productId
//     };
    
//     sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
//     navigate('/buyer/payment', { state: { paymentData } });
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setSelectedTrade(null);
//   };

//   if (loading) {
//     return (
//       <div className='flex justify-center items-center py-16'>
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className='flex justify-center items-center py-16'>
//         <div className="text-center">
//           <p className="text-red-600 mb-4">{error}</p>
//           <BlueButton text="Retry" onClick={fetchPurchaseOrders} />
//         </div>
//       </div>
//     );
//   }

//   if (orders.length === 0) {
//     return (
//       <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
//         <HeadingDescription 
//           heading='Purchase Orders' 
//           description='Your accepted purchase requests ready for payment' 
//         />
//         <div className="flex flex-col items-center justify-center py-16">
//           <div className="text-gray-400 text-6xl mb-4">📦</div>
//           <h3 className="text-xl font-semibold text-gray-900 mb-2">No Purchase Orders</h3>
//           <p className="text-gray-600">No purchase requests have been accepted yet.</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
//         <div className='flex w-full justify-between'>
//           <HeadingDescription 
//             heading='Purchase Orders' 
//             description='Your accepted purchase requests ready for payment' 
//           />
//           <div className='flex gap-2 mt-auto mr-2 my-auto'>
//             <BlueButton text='Filter' />
//             <BlueButton text='Export CSV' />
//           </div>
//         </div>

//         <Table
//           headers={[
//             'Order ID',
//             'Product',
//             'Seller',
//             'Quantity',
//             'Amount',
//             'Status',
//             'Actions'
//           ]}
//           rows={orders.map(order => (
//             <TableRow
//               key={order.id}
//               cells={[
//                 order.id.substring(0, 8) + '...',
//                 <div className="flex items-center gap-2">
//                   <Image 
//                     src={order.product?.productImage} 
//                     alt={order.product?.name || 'Product'} 
//                     className="w-12 h-12 object-cover rounded"
//                   />
//                   <div>
//                     <p className="font-medium text-sm">{order.product?.name || 'Unknown Product'}</p>
//                     <p className="text-xs text-gray-500">₹{(order.offered_price || 0).toLocaleString()} per unit</p>
//                     {order.counter_offer_price && (
//                       <p className="text-xs text-green-600">Final: ₹{order.counter_offer_price.toLocaleString()}</p>
//                     )}
//                   </div>
//                 </div>,
//                 <div>
//                   <p className="font-medium">
//                     {order.seller?.firstName && order.seller?.lastName 
//                       ? `${order.seller.firstName} ${order.seller.lastName}` 
//                       : 'Unknown Seller'}
//                   </p>
//                   <p className="text-xs text-gray-500">{order.seller?.email || ''}</p>
//                 </div>,
//                 `${order.quantity} units`,
//                 `₹${((order.counter_offer_price || order.offered_price || 0) * order.quantity).toLocaleString()}`,
//                 <StatusIndicator status={order.status} />,
//                 <div className="flex gap-2 flex-wrap">
//                   <button 
//                     onClick={() => handleProceedToPay(order)}
//                     className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
//                   >
//                     Pay Now
//                   </button>
//                   <button 
//                     onClick={() => handleViewDetails(order.id)}
//                     disabled={loadingDetails}
//                     className="text-blue-600 text-sm hover:underline font-medium disabled:opacity-50"
//                   >
//                     {loadingDetails ? 'Loading...' : 'View Details'}
//                   </button>
//                 </div>
//               ]}
//             />
//           ))}
//         />
//       </div>

//       {/* Trade Details Modal */}
//       <TradeDetailsModal
//         trade={selectedTrade}
//         isOpen={isModalOpen}
//         onClose={closeModal}
//         onProceedToPay={handleProceedToPay}
//       />
//     </>
//   );
// };

// const BuyAgain: React.FC = () => {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchRecommendedProducts();
//   }, []);

//   const fetchRecommendedProducts = async () => {
//     try {
//       const response = await productService.getFeaturedProducts(12);
//       if (response.success) {
//         setProducts(response.products);
//       }
//     } catch (error) {
//       console.error('Error fetching products:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="grid grid-cols-4 gap-6">
//         {[...Array(8)].map((_, index) => (
//           <ProductCard key={index} />
//         ))}
//       </div>
//     );
//   }

//   if (products.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center py-16">
//         <div className="text-gray-400 text-6xl mb-4">🛍️</div>
//         <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Available</h3>
//         <p className="text-gray-600">Check back later for new products.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//       {products.map((product: any) => (
//         <ProductCard key={product.id} product={product} />
//       ))}
//     </div>
//   );
// };

// // Trade Details Modal Component
// const TradeDetailsModal: React.FC<{
//   trade: Trade | null;
//   isOpen: boolean;
//   onClose: () => void;
//   onProceedToPay?: (trade: Trade) => void;
// }> = ({ trade, isOpen, onClose, onProceedToPay }) => {
//   if (!isOpen || !trade) return null;

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const getStatusBadge = (status: string) => {
//     const statusColors = {
//       pending: 'bg-yellow-100 text-yellow-800',
//       accepted: 'bg-green-100 text-green-800',
//       rejected: 'bg-red-100 text-red-800',
//       counter_offered: 'bg-blue-100 text-blue-800',
//       expired: 'bg-gray-100 text-gray-800',
//       completed: 'bg-purple-100 text-purple-800'
//     };
    
//     return (
//       <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
//         {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
//       </span>
//     );
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
//         <div className="p-6">
//           {/* Header */}
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-2xl font-bold text-gray-900">Trade Details</h2>
//             <button
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600 text-2xl"
//             >
//               ×
//             </button>
//           </div>

//           {/* Trade Status and ID */}
//           <div className="mb-6 p-4 bg-gray-50 rounded-lg">
//             <div className="flex justify-between items-center mb-2">
//               <span className="text-sm text-gray-600">Trade ID: {trade.id}</span>
//               {getStatusBadge(trade.status)}
//             </div>
//             <div className="text-sm text-gray-600">
//               Created: {formatDate(trade.created_at || trade.createdAt || '')}
//               {(trade.expires_at || trade.expiresAt) && (
//                 <span className="ml-4">Expires: {formatDate(trade.expires_at || trade.expiresAt || '')}</span>
//               )}
//             </div>
//           </div>

//           {/* Product Information */}
//           <div className="mb-6">
//             <h3 className="text-lg font-semibold mb-3">Product Information</h3>
//             <div className="flex items-center gap-4 p-4 border rounded-lg">
//               <Image 
//                 src={trade.product?.productImage} 
//                 alt={trade.product?.name || 'Product'} 
//                 className="w-20 h-20 object-cover rounded"
//               />
//               <div className="flex-1">
//                 <h4 className="font-medium text-lg">{trade.product?.name || 'Unknown Product'}</h4>
//                 <p className="text-gray-600">Quantity: {trade.quantity} units</p>
//                 <p className="text-gray-600">Your Offer: ₹{(trade.offered_price || 0).toLocaleString()} per unit</p>
//                 {trade.counter_offer_price && (
//                   <p className="text-blue-600 font-medium">Counter Offer: ₹{trade.counter_offer_price.toLocaleString()} per unit</p>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Seller Information */}
//           <div className="mb-6">
//             <h3 className="text-lg font-semibold mb-3">Seller Information</h3>
//             <div className="p-4 border rounded-lg">
//               <p className="font-medium">
//                 {trade.seller?.firstName && trade.seller?.lastName 
//                   ? `${trade.seller.firstName} ${trade.seller.lastName}` 
//                   : 'Unknown Seller'}
//               </p>
//               <p className="text-gray-600">{trade.seller?.email || ''}</p>
//             </div>
//           </div>

//           {/* Pricing Details */}
//           <div className="mb-6">
//             <h3 className="text-lg font-semibold mb-3">Pricing Details</h3>
//             <div className="p-4 border rounded-lg space-y-2">
//               <div className="flex justify-between">
//                 <span>Your Offered Price per Unit:</span>
//                 <span className="font-medium">₹{(trade.offered_price || 0).toLocaleString()}</span>
//               </div>
//               {trade.counter_offer_price && (
//                 <div className="flex justify-between text-blue-600">
//                   <span>Counter Offer Price per Unit:</span>
//                   <span className="font-medium">₹{trade.counter_offer_price.toLocaleString()}</span>
//                 </div>
//               )}
//               <div className="flex justify-between">
//                 <span>Quantity:</span>
//                 <span className="font-medium">{trade.quantity} units</span>
//               </div>
//               <div className="border-t pt-2 flex justify-between text-lg font-semibold">
//                 <span>Total Amount:</span>
//                 <span>₹{((trade.counter_offer_price || trade.offered_price || 0) * trade.quantity).toLocaleString()}</span>
//               </div>
//             </div>
//           </div>

//           {/* Messages */}
//           {(trade.buyer_message || trade.seller_message || trade.rejection_reason) && (
//             <div className="mb-6">
//               <h3 className="text-lg font-semibold mb-3">Messages</h3>
//               <div className="space-y-3">
//                 {trade.buyer_message && (
//                   <div className="p-3 bg-blue-50 rounded-lg">
//                     <p className="text-sm font-medium text-blue-800">Your Message:</p>
//                     <p className="text-blue-700">{trade.buyer_message}</p>
//                   </div>
//                 )}
//                 {trade.seller_message && (
//                   <div className="p-3 bg-green-50 rounded-lg">
//                     <p className="text-sm font-medium text-green-800">Seller's Message:</p>
//                     <p className="text-green-700">{trade.seller_message}</p>
//                   </div>
//                 )}
//                 {trade.rejection_reason && (
//                   <div className="p-3 bg-red-50 rounded-lg">
//                     <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
//                     <p className="text-red-700">{trade.rejection_reason}</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Trade Terms */}
//           {trade.trade_terms && (
//             <div className="mb-6">
//               <h3 className="text-lg font-semibold mb-3">Trade Terms</h3>
//               <div className="p-4 border rounded-lg">
//                 <pre className="text-sm text-gray-700 whitespace-pre-wrap">
//                   {typeof trade.trade_terms === 'string' 
//                     ? trade.trade_terms 
//                     : JSON.stringify(trade.trade_terms, null, 2)}
//                 </pre>
//               </div>
//             </div>
//           )}

//           {/* Action Buttons */}
//           <div className="flex gap-3 justify-end">
//             <button
//               onClick={onClose}
//               className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
//             >
//               Close
//             </button>
//             {trade.status === 'accepted' && onProceedToPay && (
//               <button
//                 onClick={() => onProceedToPay(trade)}
//                 className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
//               >
//                 Proceed to Pay
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Trade: React.FC = () => {
//   const tabLabels = [
//     { label: 'Purchase Request Status' },
//     { label: 'Purchase Order Status' },
//     { label: 'All Trades' },
//     { label: 'Buy Again' }
//   ];
//   const [activeTab, setActiveTab] = React.useState(tabLabels[0].label);
  
//   const handleTabChange = (tab: string): void => {
//     setActiveTab(tab);
//   };

//   return (
//     <div className="w-[98%] mx-auto text-lg p-8 bg-white rounded-xl shadow-lg">
//       <TradeHistorySearch className="w-fit mx-auto my-8" />
//       <Tabs
//         tabs={tabLabels}
//         activeTab={activeTab}
//         onTabChange={handleTabChange}
//         className='scale-110 !w-[88%]'
//       />

//       {/* Render tab content based on activeTab */}
//       <div className="mt-4">
//         {activeTab === 'Purchase Request Status' && <PurchaseRequestStatus />}
//         {activeTab === 'Purchase Order Status' && <PurchaseOrderStatus />}
//         {activeTab === 'All Trades' && <PurchaseRequestStatus />}
//         {activeTab === 'Buy Again' && <BuyAgain />}
//       </div>
//     </div>
//   );
// };

// export default Trade;