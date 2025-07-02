import React, { useState, useEffect } from "react";
import CartItem from "../components/cart/CartItemcard";
import CartList from "../components/cart/CartList";
import CheckoutStepper from "../components/cart/CheckoutStepper";
import BillForCart from "../components/cart/BillForCart";
import CardCount from "../components/cart/CardCount";
import ProductCard from "../components/ProductCard";
import cartService, { CartItem as CartItemType, CartSummary } from "../../services_old/cart.service";
import productService from "../../services_old/product.service";

export default function CartPage() {
  const [cartSummary, setCartSummary] = useState<CartSummary>({
    items: [],
    totalItems: 0,
    totalMRP: 0,
    discount: 0,
    platformFee: 0,
    shippingFee: 0,
    totalAmount: 0
  });
  const [allSelected, setAllSelected] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadCartData();
    loadRecommendedProducts();
  }, []);

  const loadCartData = () => {
    try {
      const summary = cartService.getCartSummary();
      setCartSummary(summary);
      setSelectedItems(summary.items.map(item => item.id));
      setLoading(false);
    } catch (error) {
      console.error('Error loading cart data:', error);
      setLoading(false);
    }
  };

  const loadRecommendedProducts = async () => {
    try {
      const response = await productService.getFeaturedProducts(8);
      if (response.success) {
        setRecommendedProducts(response.products);
      }
    } catch (error) {
      console.error('Error loading recommended products:', error);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    cartService.removeFromCart(itemId);
    loadCartData();
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    cartService.updateQuantity(itemId, quantity);
    loadCartData();
  };

  const handleItemSelect = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      setAllSelected(false);
    }
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartSummary.items.map(item => item.id));
    }
    setAllSelected(!allSelected);
  };

  const calculateSelectedItemsTotal = () => {
    const selectedItemsData = cartSummary.items.filter(item => selectedItems.includes(item.id));
    const totalMRP = selectedItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = totalMRP * 0.05;
    const platformFee = totalMRP > 500 ? 10 : 20;
    const shippingFee = totalMRP > 1000 ? 0 : 50;
    const totalAmount = totalMRP - discount + platformFee + shippingFee;

    return {
      totalMRP,
      discount,
      platformFee,
      shippingFee,
      totalAmount
    };
  };

  const handleProceedToCheckout = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to proceed');
      return;
    }

    setIsProcessing(true);

    try {
      // Store selected cart items for checkout flow
      const selectedCartItems = cartSummary.items.filter(item => selectedItems.includes(item.id));
      
      // Store checkout data in localStorage for the checkout flow
      const checkoutData = {
        selectedItems: selectedCartItems,
        summary: calculateSelectedItemsTotal(),
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('checkout_data', JSON.stringify(checkoutData));
      
      // Navigate to address page
      window.location.href = '/buyer/buyer-address';
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      alert('Failed to proceed to checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedItemsCalculation = calculateSelectedItemsTotal();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (cartSummary.items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <CheckoutStepper currentStep={0} />
        <div className="container mx-auto p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">🛒</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
              <button
                onClick={() => window.location.href = '/buyer/homepage'}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <CheckoutStepper currentStep={0} />
      <div className="container mx-auto p-4">
        <div className="mt-4 flex flex-col lg:flex-row gap-6">
          {/* Left: Cart Items */}
          <div className="flex-1 flex flex-col gap-4">
            <CardCount
              selected={selectedItems.length}
              total={cartSummary.totalItems}
              allSelected={allSelected}
              onToggleAll={handleToggleAll}
            />
            
            {/* Cart Items List */}
            <div className="space-y-4">
              {cartSummary.items.map((item) => (
                <CartItem
                  key={item.id}
                  title={item.productName}
                  price={`₹${item.price.toLocaleString()}`}
                  image={item.productImage || '/placeholder-product.svg'}
                  quantity={item.quantity}
                  selected={selectedItems.includes(item.id)}
                  sellerName={item.sellerName}
                  onRemove={() => handleRemoveItem(item.id)}
                  onUpdateQuantity={(quantity) => handleUpdateQuantity(item.id, quantity)}
                  onSelect={(selected) => handleItemSelect(item.id, selected)}
                />
              ))}
            </div>
          </div>

          {/* Right: Bill Summary */}
          <div className="w-full lg:w-2/5 xl:w-1/3">
            <BillForCart
              totalMRP={`₹${selectedItemsCalculation.totalMRP.toLocaleString()}`}
              discountOnMRP={`₹${selectedItemsCalculation.discount.toLocaleString()}`}
              platformFee={`₹${selectedItemsCalculation.platformFee}`}
              shippingFee={selectedItemsCalculation.shippingFee === 0 ? "FREE" : `₹${selectedItemsCalculation.shippingFee}`}
              totalAmount={`₹${selectedItemsCalculation.totalAmount.toLocaleString()}`}
              onProceed={handleProceedToCheckout}
              itemsSelected={selectedItems.length}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>
      
      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <div id="Recommended-for-you" className="px-4 py-8 mx-2 my-10">
          <h1 className="text-2xl font-semibold mb-6">Recommended for you</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}