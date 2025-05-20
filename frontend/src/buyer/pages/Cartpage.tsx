import React from "react";
import CartItem from "../components/cart/CartItemcard";
import CartList from "../components/cart/CartList";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4">
        <div className="mt-4">
          <CartItem title="Product 1" price="$100" image="/protein.png" />
          <CartList />
        </div>
      </div>
    </div>
  );
}