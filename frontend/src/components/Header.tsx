import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from 'lucide-react'


export const Header = () => {
    const navigate = useNavigate();


    return (
        <>
            <header className="w-[full] mt-6 flex bg-black px-4 py-3 rounded-lg">
                <div className="flex text-white ">
                    <label className="my-auto">Sort: &nbsp;</label>
                    <select className="sort-select bg-transparent cursor-pointer ">
                        <option value="last-week">Last week</option>
                        <option value="month">Last Month</option>
                        <option value="year">Last Year</option>
                    </select>
                </div>

                <div className="flex ml-auto mr-8">
                    <Bell className="my-auto mr-4 cursor-pointer " color="white" size={22} />
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