import React, { useState } from "react";
import CartItem from "../components/cart/CartItemcard";
import CartList from "../components/cart/CartList";
import CheckoutStepper from "../components/cart/CheckoutStepper";
import BillForCart from "../components/cart/BillForCart";
import CheckPincode from "../components/cart/CheckPincode";
import CardCount from "../components/cart/CardCount";

export default function CartPage() {
  const [allSelected, setAllSelected] = useState(true);

  return (
    <div className="min-h-screen bg-white">
      <CheckoutStepper currentStep={0} />
      <div className="container mx-auto p-4">
        <div className="mt-4 flex flex-col lg:flex-row gap-6">
          {/* Left: CardCount + CheckPincode + Products */}
          <div className="flex-1 flex flex-col gap-4">
            <CheckPincode />
            <CardCount
              selected={1}
              total={10}
              allSelected={allSelected}
              onToggleAll={() => setAllSelected((prev) => !prev)}
            />
            <CartItem title="Product 1" price="$100" image="/protein.png" />
            <CartList />
          </div>
          {/* Right: BillForCart */}
          <div className="w-full lg:w-2/5 xl:w-1/3">
            <BillForCart
              totalMRP="$100"
              discountOnMRP="$10"
              platformFee="$2"
              shippingFee="FREE"
              totalAmount="$92"
              onProceed={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}