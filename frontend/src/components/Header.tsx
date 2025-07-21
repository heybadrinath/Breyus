import React from "react";
import { useNavigate } from "react-router-dom";
const Header = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // authService.logout();
        navigate('/');
    };

    return (
        <>
            <header className="w-[96%] mt-6">
                <div id="left-header">
                    <select className="sort-select bg-transparent">
                        <option value="last-week">Last week</option>
                        <option value="month">Last Month</option>
                        <option value="year">Last Year</option>
                    </select>
                </div>
                <div className="sa"></div>
                <div id="right-header">
                    {/* <img src={notifications} alt="Notifications" /> */}
                    {/* <button className="breyus-core-animated-border">Try Breyus Core</button> */}
                    <button className="bg-gradient-to-tr from-[#bca86b] to-[#3d3729] text-white font-semibold px-6 py-2 rounded-full shadow-inner hover:scale-105 transition-transform"
                        onClick={() => window.location.href = '/buyer/ai'}>
                        Try Breyus Core
                    </button>

                </div>
            </header>
        </>
    );
};