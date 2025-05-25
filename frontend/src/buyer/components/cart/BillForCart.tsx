import React from "react";

interface BillForCartProps {
  totalMRP: string;
  discountOnMRP: string;
  couponDiscount?: string;
  platformFee: string;
  shippingFee: string;
  totalAmount: string;
  onProceed: () => void;
  isCouponApplied?: boolean;
  itemsSelected?: number;
  isProcessing?: boolean;
}

const BillForCart: React.FC<BillForCartProps> = ({
  totalMRP,
  discountOnMRP,
  couponDiscount,
  platformFee,
  shippingFee,
  totalAmount,
  onProceed,
  isCouponApplied = false,
  itemsSelected = 0,
  isProcessing = false,
}) => (
  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 max-w-md mx-auto border border-gray-200">
    <div className="text-center mb-4 bg-blue-50 p-3 rounded-lg">
      <span className="font-semibold text-blue-700">Checkout Process:</span> 
      <span className="text-blue-600"> Review items and proceed to address</span>
    </div>
    <div className="border-b pb-4 mb-4">
      <div className="font-bold text-lg mb-2">
        Price Details 
        <span className="font-normal text-base">
          ({itemsSelected} {itemsSelected === 1 ? 'Item' : 'Items'} Selected)
        </span>
      </div>
      <div className="flex justify-between py-1">
        <span>TOTAL MRP</span>
        <span>{totalMRP}</span>
      </div>
      <div className="flex justify-between py-1">
        <span>DISCOUNT ON MRP</span>
        <span className="text-green-500">-{discountOnMRP}</span>
      </div>
      <div className="flex justify-between py-1">
        <span>COUPON DISCOUNT</span>
        {isCouponApplied ? (
          <span className="text-green-500">{couponDiscount}</span>
        ) : (
          <span className="text-blue-500 font-semibold cursor-pointer hover:underline">Apply Coupon</span>
        )}
      </div>
      <div className="flex justify-between py-1">
        <span>PLATFORM FEE</span>
        <span>{platformFee}</span>
      </div>
      <div className="flex justify-between py-1">
        <span>SHIPPING FEE</span>
        <span className={shippingFee === "FREE" ? "text-green-500" : ""}>{shippingFee}</span>
      </div>
      {shippingFee === "FREE" && (
        <div className="text-xs text-green-600 pl-1">🎉 You saved shipping charges!</div>
      )}
    </div>
    <div className="flex justify-between font-bold text-lg mb-4">
      <span>TOTAL AMOUNT</span>
      <span>{totalAmount}</span>
    </div>
    <button
      className={`w-full font-semibold py-3 rounded-lg shadow transition ${
        itemsSelected > 0 && !isProcessing
          ? 'bg-gradient-to-r from-gray-800 to-black text-white hover:from-black hover:to-gray-800'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
      onClick={onProceed}
      disabled={itemsSelected === 0 || isProcessing}
    >
      {isProcessing ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-2"></div>
          Processing...
        </div>
      ) : itemsSelected > 0 ? (
        'Proceed to Checkout'
      ) : (
        'Select items to proceed'
      )}
    </button>
  </div>
);

export default BillForCart;
