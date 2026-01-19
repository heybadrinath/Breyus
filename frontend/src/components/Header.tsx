import React, { useState } from "react";
import { useNavigate, } from "react-router-dom";
import { Search } from 'lucide-react'
import { NotificationBell } from './NotificationBell';
import SelectField from './SelectField';


export const SortHeader = () => {
    const navigate = useNavigate();


    return (
        <>
            <header className="w-[full] mt-6 flex bg-black px-4 py-3 rounded-lg">
                <div className="flex text-white ">
                    <label className="my-auto">Sort: &nbsp;</label>
                    <SelectField className="select-field--dark select-field--sm w-fit">
                        <option value="last-week">Last week</option>
                        <option value="month">Last Month</option>
                        <option value="year">Last Year</option>
                    </SelectField>
                </div>

                <div className="flex ml-auto mr-8">
                    <NotificationBell className="my-auto mr-4" color="white" size={22} />
                    <button className="border-[#bca86b] border shadow-[#bca86b] text-white font-semibold px-6 py-3 rounded-full shadow-sm hover:scale-105 transition-transform"
                        onClick={() => navigate('/buyer/ai')}>
                        <svg className='inline mr-3' width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.0003 6.49934L7.66699 5.24934L11.0003 3.99809L12.2503 0.666016L13.5015 3.99809L16.8336 5.24934L13.5015 6.49934L12.2503 9.83266L11.0003 6.49934ZM4.33363 13.166L0.166992 11.4993L4.33363 9.83266L6.00031 5.66602L7.66699 9.83266L11.8336 11.4993L7.66699 13.166L6.00031 17.3327L4.33363 13.166Z" fill="white" />
                        </svg>

                        Try Breyus Core
                    </button>

                </div>
            </header>
        </>
    );
};




export const TryBreyusCoreHeader = () => {
    const navigate = useNavigate();


    return (
        <>
            <header className="w-full bg-white px-6 py-3 flex items-center justify-end gap-6 border-b border-gray-200">
                <div className="flex items-center gap-6">
                    <NotificationBell className="text-gray-600" color="#4B5563" size={22} />
                    <button className="border-[#bca86b] border-2 shadow-[#bca86b] bg-black text-white font-semibold px-6 py-3 rounded-full shadow-sm hover:scale-105 transition-transform"
                        onClick={() => navigate('/buyer/ai')}>
                        <svg className='inline mr-3' width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.0003 6.49934L7.66699 5.24934L11.0003 3.99809L12.2503 0.666016L13.5015 3.99809L16.8336 5.24934L13.5015 6.49934L12.2503 9.83266L11.0003 6.49934ZM4.33363 13.166L0.166992 11.4993L4.33363 9.83266L6.00031 5.66602L7.66699 9.83266L11.8336 11.4993L7.66699 13.166L6.00031 17.3327L4.33363 13.166Z" fill="white" />
                        </svg>
                        Try Breyus Core
                    </button>

                </div>
            </header>
        </>
    );
};





interface SearchHeaderProps {
    onSearch?: (searchTerm: string) => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate()

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(searchTerm);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
    };


    return (
        <nav className="w-full bg-white px-6 py-3 flex items-center justify-between gap-4 border-b border-gray-200">
            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
                <div className="flex items-center bg-white px-4 py-2 rounded-xl text-gray-800 gap-2 border border-gray-200">
                    <Search className="w-6 h-6 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="bg-transparent outline-none placeholder-gray-400 w-full"
                    />
                </div>
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-6 ml-4">
                <NotificationBell className="text-gray-600" color="#4B5563" size={24} />

                <button className="border-[#bca86b] border bg-black shadow-[#bca86b] text-white font-semibold px-6 py-3 rounded-full shadow-sm hover:scale-105 transition-transform"
                    onClick={() => navigate('/buyer/ai')}>
                    <svg className='inline mr-3' width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.0003 6.49934L7.66699 5.24934L11.0003 3.99809L12.2503 0.666016L13.5015 3.99809L16.8336 5.24934L13.5015 6.49934L12.2503 9.83266L11.0003 6.49934ZM4.33363 13.166L0.166992 11.4993L4.33363 9.83266L6.00031 5.66602L7.66699 9.83266L11.8336 11.4993L7.66699 13.166L6.00031 17.3327L4.33363 13.166Z" fill="white" />
                    </svg>

                    Try Breyus Core
                </button>
            </div>
        </nav>
    );
};



export const SearchHeaderLight: React.FC<SearchHeaderProps> = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate()

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(searchTerm);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
    };


    return (
        <nav className="w-full bg-white px-6 py-3 flex items-center justify-between gap-4 border-b border-gray-200">
            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
                <div className="flex items-center bg-white px-4 py-2 rounded-xl text-gray-800 gap-2 border border-gray-200">
                    <Search className="w-6 h-6 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="bg-transparent outline-none placeholder-gray-400 w-full"
                    />
                </div>
            </form>
       

            {/* Right Icons */}
            <div className="flex items-center gap-6 ml-4">
                <NotificationBell className="text-gray-600" color="#4B5563" size={24} />

                <button className="border-[#bca86b] border bg-black shadow-[#bca86b] text-white font-semibold px-6 py-3 rounded-full shadow-sm hover:scale-105 transition-transform"
                    onClick={() => navigate('/buyer/ai')}>
                    <svg className='inline mr-3' width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.0003 6.49934L7.66699 5.24934L11.0003 3.99809L12.2503 0.666016L13.5015 3.99809L16.8336 5.24934L13.5015 6.49934L12.2503 9.83266L11.0003 6.49934ZM4.33363 13.166L0.166992 11.4993L4.33363 9.83266L6.00031 5.66602L7.66699 9.83266L11.8336 11.4993L7.66699 13.166L6.00031 17.3327L4.33363 13.166Z" fill="white" />
                    </svg>

                    Try Breyus Core
                </button>
            </div>
        </nav>
    );
};
