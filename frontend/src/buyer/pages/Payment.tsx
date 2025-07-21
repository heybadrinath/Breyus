import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import authService from '../../services_old/auth.service';

// interface PaymentData {
//   tradeId: string;
//   amount: number;
//   productName: string;
//   quantity: number;
//   pricePerUnit: number;
//   sellerId: string;
//   productId: string;
// }

// const Payment: React.FC = () => {
//   const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [paymentMethod, setPaymentMethod] = useState('card');
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     // Get payment data from sessionStorage or location state
//     const storedData = sessionStorage.getItem('paymentData');
//     const stateData = location.state?.paymentData;
    
//     if (stateData) {
//       setPaymentData(stateData);
//     } else if (storedData) {
//       try {
//         setPaymentData(JSON.parse(storedData));
//       } catch (error) {
//         console.error('Error parsing payment data:', error);
//         navigate('/buyer/trade');
//       }
//     } else {
//       // No payment data found, redirect to trade page
//       navigate('/buyer/trade');
//     }
//   }, [navigate, location.state]);

//   const handlePayment = async () => {
//     if (!paymentData) return;

//     setLoading(true);
//     try {
//       // Simulate payment processing
//       await new Promise(resolve => setTimeout(resolve, 2000));
      
//       // Clear payment data
//       sessionStorage.removeItem('paymentData');
      
//       // Show success message and redirect
//       alert('Payment successful! Your order has been placed.');
//       navigate('/buyer/trade');
//     } catch (error) {
//       console.error('Payment error:', error);
//       alert('Payment failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!paymentData) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <div className="bg-white rounded-lg shadow-lg p-8">
//         <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Payment</h1>
        
//         {/* Order Summary */}
//         <div className="mb-8 p-6 bg-gray-50 rounded-lg">
//           <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
//           <div className="space-y-3">
//             <div className="flex justify-between">
//               <span>Product:</span>
//               <span className="font-medium">{paymentData.productName}</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Quantity:</span>
//               <span className="font-medium">{paymentData.quantity} units</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Price per unit:</span>
//               <span className="font-medium">₹{paymentData.pricePerUnit?.toLocaleString()}</span>
//             </div>
//             <div className="border-t pt-3 flex justify-between text-lg font-bold">
//               <span>Total Amount:</span>
//               <span>₹{paymentData.amount.toLocaleString()}</span>
//             </div>
//           </div>
//         </div>

//         {/* Payment Method */}
//         <div className="mb-8">
//           <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
//           <div className="space-y-3">
//             <label className="flex items-center">
//               <input
//                 type="radio"
//                 name="paymentMethod"
//                 value="card"
//                 checked={paymentMethod === 'card'}
//                 onChange={(e) => setPaymentMethod(e.target.value)}
//                 className="mr-3"
//               />
//               <span>Credit/Debit Card</span>
//             </label>
//             <label className="flex items-center">
//               <input
//                 type="radio"
//                 name="paymentMethod"
//                 value="upi"
//                 checked={paymentMethod === 'upi'}
//                 onChange={(e) => setPaymentMethod(e.target.value)}
//                 className="mr-3"
//               />
//               <span>UPI</span>
//             </label>
//             <label className="flex items-center">
//               <input
//                 type="radio"
//                 name="paymentMethod"
//                 value="netbanking"
//                 checked={paymentMethod === 'netbanking'}
//                 onChange={(e) => setPaymentMethod(e.target.value)}
//                 className="mr-3"
//               />
//               <span>Net Banking</span>
//             </label>
//           </div>
//         </div>

//         {/* Payment Form */}
//         {paymentMethod === 'card' && (
//           <div className="mb-8 p-6 border rounded-lg">
//             <h3 className="text-lg font-semibold mb-4">Card Details</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">Card Number</label>
//                 <input
//                   type="text"
//                   placeholder="1234 5678 9012 3456"
//                   className="w-full p-3 border rounded-lg"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Expiry Date</label>
//                 <input
//                   type="text"
//                   placeholder="MM/YY"
//                   className="w-full p-3 border rounded-lg"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">CVV</label>
//                 <input
//                   type="text"
//                   placeholder="123"
//                   className="w-full p-3 border rounded-lg"
//                 />
//               </div>
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1">Cardholder Name</label>
//                 <input
//                   type="text"
//                   placeholder="John Doe"
//                   className="w-full p-3 border rounded-lg"
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         {paymentMethod === 'upi' && (
//           <div className="mb-8 p-6 border rounded-lg">
//             <h3 className="text-lg font-semibold mb-4">UPI Details</h3>
//             <div>
//               <label className="block text-sm font-medium mb-1">UPI ID</label>
//               <input
//                 type="text"
//                 placeholder="yourname@upi"
//                 className="w-full p-3 border rounded-lg"
//               />
//             </div>
//           </div>
//         )}

//         {paymentMethod === 'netbanking' && (
//           <div className="mb-8 p-6 border rounded-lg">
//             <h3 className="text-lg font-semibold mb-4">Select Your Bank</h3>
//             <select className="w-full p-3 border rounded-lg">
//               <option value="">Select Bank</option>
//               <option value="sbi">State Bank of India</option>
//               <option value="hdfc">HDFC Bank</option>
//               <option value="icici">ICICI Bank</option>
//               <option value="axis">Axis Bank</option>
//               <option value="kotak">Kotak Mahindra Bank</option>
//             </select>
//           </div>
//         )}

//         {/* Action Buttons */}
//         <div className="flex gap-4 justify-end">
//           <button
//             onClick={() => navigate('/buyer/trade')}
//             className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handlePayment}
//             disabled={loading}
//             className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? 'Processing...' : `Pay ₹${paymentData.amount.toLocaleString()}`}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Payment;