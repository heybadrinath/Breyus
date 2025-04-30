import React from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Navbar from '../components/navbar';

const Wishlist = () => {
  return (
    <div className="flex h-screen overflow-hidden">

        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-0 h-screen">
            <Sidebar />
        </div>

            {/* Main Content Area */}
        <div className="flex-1 ml-64 overflow-y-auto">
            {/* Fixed Navbar */}
            <div className="fixed top-0 right-0 left-64 z-10 p-6">
                <Navbar />
            </div>

            {/* Product Grid */}
            <div className="p-6 mt-28">
                <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <ProductCard />
                    <ProductCard />
                    <ProductCard />
                    <ProductCard />
                    <ProductCard />
                    <ProductCard />
                </div>
            </div>
        </div>  
    </div>
  );
};

export default Wishlist;