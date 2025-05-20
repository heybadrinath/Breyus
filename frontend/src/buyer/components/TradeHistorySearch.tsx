import React from 'react';

interface TradeHistorySearchProps {
  className?: string;
}

const TradeHistorySearch: React.FC<TradeHistorySearchProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-8 p-8 bg-[#fcfcfc] ${className}`}>
      <h1 className="text-4xl font-semibold text-black mr-12">Trade History</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-4 py-2 w-80">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-gray-500 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search all the trades"
            className="outline-none bg-transparent w-full text-gray-700 placeholder-gray-400"
          />
        </div>
        <button className="bg-white border border-gray-200 rounded-full px-6 py-2 text-gray-400 font-medium hover:bg-gray-100 transition">
          Search trades
        </button>
      </div>
    </div>
  );
};

export default TradeHistorySearch; 