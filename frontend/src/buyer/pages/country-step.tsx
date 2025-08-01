// buyer/pages/country-step.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const CountryStep: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { commodity } = location.state as { commodity: string };
  const [countryOrContinent, setCountryOrContinent] = useState('');
  const [port, setPort] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('');

  // Dummy port lookup for continent
  const continentPortMap: Record<string, string> = {
    Asia: 'Mumbai',
    Europe: 'Rotterdam',
    Africa: 'Durban',
    NorthAmerica: 'Los Angeles',
    SouthAmerica: 'Santos',
    Australia: 'Sydney',
    Antarctica: 'None',
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCountryOrContinent(value);
    setSelectedContinent(''); // Clear continent selection if typing manually
    setPort(''); // Require manual entry for country
  };

  const handleContinentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedContinent(value);
    setCountryOrContinent(value);
    if (continentPortMap[value]) {
      setPort(continentPortMap[value]);
    } else {
      setPort('');
    }
  };

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPort(e.target.value);
  };

  const handleNext = () => {
    if (countryOrContinent.trim() && port.trim()) {
      navigate('/result', { state: { commodity, country: countryOrContinent, port } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Enter Country or Continent</h2>
        <label className="block mb-2 text-gray-700 font-semibold">Select Continent (optional):</label>
        <select
          className="w-full p-3 border rounded mb-4"
          value={selectedContinent}
          onChange={handleContinentChange}
        >
          <option value="">-- Select Continent --</option>
          {Object.keys(continentPortMap).map(continent => (
            <option key={continent} value={continent}>{continent}</option>
          ))}
        </select>
        <label className="block mb-2 text-gray-700 font-semibold">Or type country:</label>
        <input
          type="text"
          className="w-full p-3 border rounded mb-4"
          placeholder="Type country..."
          value={selectedContinent ? selectedContinent : countryOrContinent}
          onChange={handleCountryChange}
          disabled={!!selectedContinent}
        />
        <label className="block mb-2 text-gray-700 font-semibold">Nearest Port:</label>
        <input
          type="text"
          className="w-full p-3 border rounded mb-4"
          placeholder="Enter nearest port..."
          value={port}
          onChange={handlePortChange}
          required
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          onClick={handleNext}
          disabled={!(countryOrContinent.trim() || selectedContinent) || !port.trim()}
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default CountryStep;
