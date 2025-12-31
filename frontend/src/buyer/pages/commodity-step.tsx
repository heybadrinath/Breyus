// buyer/pages/commodity-step.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const uniqueCommodities = [
  { name: 'Iron Ore', locked: true },
  { name: 'Coffee', locked: true },
  { name: 'Wheat', locked: true },
  { name: 'Soybeans', locked: true },
  { name: 'Copper', locked: true },
];

const CommodityStep: React.FC = () => {
  const [commodity, setCommodity] = useState('');
  const navigate = useNavigate();

  const handleNext = () => {
    if (commodity.trim()) {
      navigate('/country-step', { state: { commodity } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Enter Commodity</h2>
        <input
          type="text"
          className="w-full p-3 border rounded mb-4"
          placeholder="Type your commodity..."
          value={commodity}
          onChange={e => setCommodity(e.target.value)}
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          onClick={handleNext}
        >
          Next
        </button>
      </div>
      {/* Unique commodity box at left bottom */}
      <div className="fixed left-6 bottom-6 bg-black text-white rounded-lg shadow-lg p-4 w-64">
        <h3 className="font-bold mb-2">Unique Commodities</h3>
        <ul>
          {uniqueCommodities.map((item, idx) => (
            <li key={idx} className="flex items-center mb-2">
              <span className="mr-2">{item.name}</span>
              {item.locked && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11V7a4 4 0 118 0v4m-8 0a4 4 0 00-8 0v4a4 4 0 008 0v-4z" /></svg>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CommodityStep;
