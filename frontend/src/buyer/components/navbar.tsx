import React, { useState } from 'react';
import { Search, Bell, ShoppingCart } from "lucide-react";
import cartService from '../../services_old/cart.service';

interface NavbarProps {
  onSearch?: (searchTerm: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(cartService.getCartCount());

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Optional: Real-time search (debounced)
    // You can implement debouncing here if needed
  };

  const handleCartClick = () => {
    window.location.href = '/buyer/cartpage';
  };

  // Update cart count when cart changes
  React.useEffect(() => {
    const updateCartCount = () => {
      setCartCount(cartService.getCartCount());
    };

    // Listen for cart updates
    window.addEventListener('cart-updated', updateCartCount);
    
    return () => {
      window.removeEventListener('cart-updated', updateCartCount);
    };
  }, []);

  return (
    <nav className="w-full bg-black p-4 rounded-xl flex items-center justify-between gap-4">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
        <div className="flex items-center bg-[#2E2E2E] px-4 py-2 rounded-xl text-white gap-2">
          <Search className="w-5 h-5 text-white opacity-70" />
          <input
            type="text"
            placeholder="Search for products..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="bg-transparent outline-none placeholder-white placeholder-opacity-70 w-full"
          />
        </div>
      </form>

      {/* Right Icons */}
      <div className="flex items-center gap-6 ml-4">
        {/* Cart Icon with Badge */}
        <div className="relative cursor-pointer" onClick={handleCartClick}>
          <ShoppingCart className="text-white w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </div>
        
        <Bell className="text-white w-5 h-5 cursor-pointer" />
        
        <button className="bg-gradient-to-tr from-[#bca86b] to-[#3d3729] text-white font-semibold px-6 py-2 rounded-full shadow-inner hover:scale-105 transition-transform"
          onClick={() => window.location.href = '/buyer/ai'}>
          Try Breyus Core
        </button>
      </div>
    </nav>
  );
};

export default Navbar;