import React, { useState } from "react";
import { Trash2, Plus, Minus, Heart } from "lucide-react";

type CartItemProps = {
  title: string;
  price: string;
  image: string;
  quantity?: number;
  selected?: boolean;
  sellerName?: string;
  onRemove?: () => void;
  onUpdateQuantity?: (quantity: number) => void;
  onSelect?: (selected: boolean) => void;
};

export default function CartItem({ 
  title, 
  price, 
  image, 
  quantity = 1,
  selected = true,
  sellerName = "Unknown Seller",
  onRemove,
  onUpdateQuantity,
  onSelect
}: CartItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      if (onRemove) {
        onRemove();
      }
    } catch (error) {
      console.error('Error removing item:', error);
      setIsRemoving(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (onUpdateQuantity) {
      onUpdateQuantity(newQuantity);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelect) {
      onSelect(e.target.checked);
    }
  };

  // Calculate price per unit
  const numericPrice = parseFloat(price.replace(/[₹,]/g, ''));
  const pricePerUnit = Math.round(numericPrice / quantity);
  const totalPrice = pricePerUnit * quantity;

  return (
    <div className={`border rounded-lg p-4 flex flex-col space-y-4 transition-opacity ${
      isRemoving ? 'opacity-50' : 'opacity-100'
    }`}>
      <div className="flex items-start gap-4">
        {/* Selection Checkbox */}
        <div className="flex items-center pt-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={handleSelectChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        {/* Product Image */}
        <img 
          src={image} 
          alt={title} 
          className="w-24 h-24 object-cover rounded-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-product.svg';
          }}
        />

        {/* Product Details */}
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-1">by {sellerName}</p>
          <p className="text-green-600 text-xs mt-1">✓ In stock</p>
          <p className="text-sm text-gray-600 mt-1">
            ₹{pricePerUnit.toLocaleString()} per unit
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-3">
            {/* Quantity and Remove Controls */}
            <div className="flex items-center gap-3">
              {/* Remove Button */}
              <button 
                onClick={handleRemove}
                disabled={isRemoving}
                className="p-1 border rounded hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                title="Remove from cart"
              >
                <Trash2 size={16} className="text-red-600" />
              </button>

              {/* Quantity Controls */}
              <div className="flex items-center border rounded px-2">
                <button 
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus size={14} />
                </button>
                <span className="px-3 py-1 text-sm font-medium">{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="p-1 hover:bg-gray-100"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-x-4">
              <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Heart size={14} />
                Save to Wishlist
              </button>
              <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
              <button className="text-sm text-blue-600 hover:underline">
                Ask Queries
              </button>
              <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
              <button className="text-sm text-blue-600 hover:underline">
                View Trade Terms
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtotal */}
      <div className="border-t pt-2 text-sm font-medium text-right">
        Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'}): 
        <span className="font-bold ml-1">₹{totalPrice.toLocaleString()}</span>
      </div>
    </div>
  );
}