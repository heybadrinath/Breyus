import React from 'react';

const NoSalesData: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg p-8">
      <svg 
        className="w-16 h-16 text-gray-400 mb-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
        />
      </svg>
      <h3 className="text-xl font-semibold text-gray-600 mb-2">No Sales Data Available</h3>
      <p className="text-gray-500 text-center">
        There are no sales records to display at the moment.
        <br />
        Check back later for updates.
      </p>
    </div>
  );
};

export default NoSalesData; 