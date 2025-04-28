import React from 'react';
 import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Banner from '../components/Banner';
const Homepage: React.FC = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Welcome to the Homepage</h1>
        <Banner />
        <ProductCard />    
      </div>
    </div>
  );
};

export default Homepage;
