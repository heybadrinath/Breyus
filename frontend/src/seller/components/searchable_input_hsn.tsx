import React, { useState, useEffect } from 'react';
import { set } from 'react-hook-form';

// Define TypeScript interface for the item structure
interface Item {
  _id: string;
  hsn_code: string;
  description: string;
  category: string;
}

const SearchableInput: React.FC = () => {
  const [hsnQuery, setHsnQuery] = useState<string>(''); // Search query state
  const [hsnResults, setHsnResults] = useState<Item[]>([]); // Results state
  const [hsnLoading, setHsnLoading] = useState<boolean>(false); // Loading state
  const [isHsnSelected, setIsHsnSelected] = useState<boolean>(false); // Selection state

  // Debounced search (effect hook)
  useEffect(() => {
    if (!hsnQuery) {
      setHsnResults([]);
      return;
    }

    if(isHsnSelected) {
        setHsnResults([]);
        setIsHsnSelected(false);
        return;
    }

    const timer = setTimeout(async () => {
      setHsnLoading(true);
      try {
        const host = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${host}/products/hsn?q=${hsnQuery}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data: Item[] = await response.json();
        setHsnResults(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setHsnLoading(false);
      }
    }, 300); // Debounce delay in ms

    return () => clearTimeout(timer); // Clean up timer on component unmount
  }, [hsnQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHsnQuery(e.target.value);
  };

  const handleSelect = (item: Item) => {
    // Handle item selection
    setHsnQuery(item.hsn_code); // Optionally update input with selected HSN code
    setHsnResults([]);
    setIsHsnSelected(true);
  };

  return (
    <>
      <input
        type="text"
        value={hsnQuery}
        onChange={handleChange}
        placeholder="Search by HSN code, description, or category"
      />
      {hsnLoading && <p>Loading...</p>}
      {hsnResults.length > 0 && !isHsnSelected && (
        <ul className="w-fit bg-white border border-gray-300 rounded-md px-4 h-[300px] overflow-y-scroll">
          {hsnResults.map((item) => (
            <li
              key={item._id}
              onClick={() => handleSelect(item)}
              className="py-2 px-4 my-3 hover:bg-gray-100 cursor-pointer"
            >
              <strong>{item.hsn_code}</strong> - {item.description} - ({item.category})
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export { SearchableInput as SearchableInputHSN };
