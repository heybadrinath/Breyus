import React from 'react';
import { Search, Bell } from "lucide-react";

const Navbar: React.FC = () => {
  return (
    <nav className="w-full bg-black p-4 rounded-xl flex items-center justify-between gap-4">
      {/* Search bar */}
      <div className="flex-1 max-w-xl flex items-center bg-[#2E2E2E] px-4 py-2 rounded-xl text-white gap-2">
        <Search className="w-5 h-5 text-white opacity-70" />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent outline-none placeholder-white placeholder-opacity-70 w-full"
        />
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-6 ml-4">
        <Bell className="text-white w-5 h-5" />
        <button className="bg-gradient-to-tr from-[#bca86b] to-[#3d3729] text-white font-semibold px-6 py-2 rounded-full shadow-inner hover:scale-105 transition-transform">
          Try Breyus Core
        </button>
      </div>
    </nav>
  );
};

export default Navbar;