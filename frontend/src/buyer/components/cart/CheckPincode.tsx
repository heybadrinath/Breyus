import React from "react";

const CheckPincode: React.FC = () => {
  return (
    <div className="flex flex-row items-center justify-between bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-3xl mx-auto shadow-sm">
      <span className="font-bold text-lg text-left">
        CHECK DELIVERY TIME & SERVICES
      </span>
      <input
        type="text"
        placeholder="ENTER PINCODE"
        className="w-full sm:w-80 px-8 py-4 rounded-xl border border-gray-200 text-center font-semibold text-gray-500 text-lg focus:outline-none focus:ring-2 focus:ring-black transition ml-4"
      />
    </div>
  );
};

export default CheckPincode;
