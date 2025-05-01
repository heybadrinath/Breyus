import React from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Banner from '../components/Banner';
import Navbar from '../components/navbar';

const Homepage: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      
        {/* Scrollable Content */}
        <div className="mx-auto w-[97%]">
          <div className="mt-6">
            <Banner className=''/>
          </div>
          
          <div className="flex flex-wrap gap-8 mt-6">
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
          </div>
        </div>
      </div>

  );
};

export default Homepage;
