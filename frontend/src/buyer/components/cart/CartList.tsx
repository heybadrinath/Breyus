import React from "react";
import CartItem from "./CartItemcard";

const CartList: React.FC = () => {
  return (
    <div className="space-y-4">
      <CartItem
        title="VAR TECH Digital Multimeter V MAS 830 LB, 3½ Digits (2000 Counts), 600 V AC/DC, with Backlight"
        price="$1,999.00"
        image="/protein.png"
      />
    </div>
  );
};

export default CartList;