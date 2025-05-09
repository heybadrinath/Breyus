import React from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Banner from '../components/Banner';
import Navbar from '../components/navbar';

const Homepage: React.FC = () => {
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

        {/* Scrollable Content */}
        <div className="p-6 mt-28">
          <div className="mt-6">
            <Banner />
          </div>
          <div className="mt-6"></div>
          <div className="flex flex-wrap gap-8">
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

export default Homepage;
