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
}) => (
  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 max-w-md mx-auto border border-gray-200">
    <div className="text-center mb-4">
      <span className="font-semibold">Login</span> to get upto $20 OFF on first order
    </div>
    <div className="border-b pb-4 mb-4">
      <div className="font-bold text-lg mb-2">Price Details <span className="font-normal text-base">(1 Item)</span></div>
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
          <span className="text-red-400 font-semibold cursor-pointer hover:underline">Apply</span>
        )}
      </div>
      <div className="flex justify-between py-1">
        <span>PLATFORM FEE</span>
        <span>{platformFee}</span>
      </div>
      <div className="flex justify-between py-1">
        <span>SHIPPING FEE</span>
        <span className="text-green-500">{shippingFee}</span>
      </div>
      <div className="text-xs text-gray-400 pl-1">Free Shipping for you</div>
    </div>
    <div className="flex justify-between font-bold text-lg mb-4">
      <span>TOTAL AMOUNT</span>
      <span>{totalAmount}</span>
    </div>
    <button
      className="w-full bg-gradient-to-r from-gray-800 to-black text-white font-semibold py-3 rounded-lg shadow hover:from-black hover:to-gray-800 transition"
      onClick={onProceed}
    >
      Proceed to Address
    </button>
  </div>
);

export default BillForCart;
