import React, { useState } from 'react';
import { Search, Bell } from "lucide-react";


interface NavbarProps {
  onSearch?: (searchTerm: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

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



  

  return (
    <nav className="w-full bg-black px-4 py-3 rounded-xl flex items-center justify-between gap-4">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
        <div className="flex items-center bg-[#2E2E2E] px-4 py-2 rounded-xl text-white gap-2">
          <Search className="w-6 h-6 #D9D9D9" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
            className="bg-[#303030] outline-none placeholder-white placeholder-opacity-70 w-full"
          />
        </div>
      </form>

      {/* Right Icons */}
      <div className="flex items-center gap-6 ml-4">
        <Bell className="text-[#CCCCCC] w-6 h-6 cursor-pointer" />

        <button className="border-[#bca86b] border shadow-[#bca86b] text-white font-semibold px-6 py-3 rounded-full shadow-sm hover:scale-105 transition-transform"
          onClick={() => window.location.href = '/buyer/ai'}>
          <svg className='inline mr-3' width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.0003 6.49934L7.66699 5.24934L11.0003 3.99809L12.2503 0.666016L13.5015 3.99809L16.8336 5.24934L13.5015 6.49934L12.2503 9.83266L11.0003 6.49934ZM4.33363 13.166L0.166992 11.4993L4.33363 9.83266L6.00031 5.66602L7.66699 9.83266L11.8336 11.4993L7.66699 13.166L6.00031 17.3327L4.33363 13.166Z" fill="white" />
          </svg>

          Try Breyus Core
        </button>
      </div>
    </nav>
  );
};

export default Navbar;