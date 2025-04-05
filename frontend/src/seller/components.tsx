import React, { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../seller/css/components.css";
import authService from "../services/auth.service";

// assets import 
import downArrow from "../seller/vectors/down-arrow.svg";
import notifications from "../seller/vectors/notifications.svg";
import fullLogo from "../seller/vectors/full-logo.svg"
import securityIcon from "../seller/vectors/security-icon.svg";
import logoutIcon from "../seller/vectors/logout-icon.svg";
import dashIcon from "../seller/vectors/dash-icon.svg";
import productIcon from "../seller/vectors/product-icon.svg";
import SettingsIcon from "../seller/vectors/settings.svg";
import helpIcon from "../seller/vectors/help.svg";


const Header = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    return (
        <>
            <header>
                <div id="left-header">
                    <div>sort: Last week</div>
                    <img alt="" src={downArrow} />
                </div>
                <div className="sa"></div>
                <div id="right-header">
                    <img src={notifications} alt="Notifications" />
                    <button>Try Breyus Core</button>
                    <button 
                        onClick={handleLogout} 
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded ml-2 flex items-center"
                    >
                        <img src={logoutIcon} alt="Logout" className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            </header>
        </>
    );
};

const Leftnav = ({ username }: { username: String }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    return (
        <>
            <div id="left-nav">
                <img src={fullLogo} alt="Logo" />

                <div id="profile-name">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 256 256"
                        width="32"
                        height="32"
                        xmlSpace="preserve"
                    >
                        <g transform="translate(1.4 1.4) scale(2.81 2.81)">
                            <path
                                d="M 45 0 C 20.147 0 0 20.147 0 45 c 0 24.853 20.147 45 45 45 s 45 -20.147 45 -45 C 90 20.147 69.853 0 45 0 z M 45 22.007 c 8.899 0 16.14 7.241 16.14 16.14 c 0 8.9 -7.241 16.14 -16.14 16.14 c -8.9 0 -16.14 -7.24 -16.14 -16.14 C 28.86 29.248 36.1 22.007 45 22.007 z M 45 83.843 c -11.135 0 -21.123 -4.885 -27.957 -12.623 c 3.177 -5.75 8.144 -10.476 14.05 -13.341 c 2.009 -0.974 4.354 -0.958 6.435 0.041 c 2.343 1.126 4.857 1.696 7.473 1.696 c 2.615 0 5.13 -0.571 7.473 -1.696 c 2.083 -1 4.428 -1.015 6.435 -0.041 c 5.906 2.864 10.872 7.591 14.049 13.341 C 66.123 78.957 56.135 83.843 45 83.843 z"
                                fill="black"
                            />
                        </g>
                    </svg>
                    <h1>{username}</h1>
                </div>


                <Link className="px-4 py-2" to="/seller/security"> <img alt="" src={securityIcon} /> Security</Link>
                <Link className="px-4 py-2" to="/"> <img alt="" src={logoutIcon} /> Logout</Link>

                <Link to="/seller/security"> <img alt="" src={securityIcon} /> Security</Link>
                <button onClick={handleLogout} className="flex items-center px-4 py-2 w-full text-left">
                    <img alt="" src={logoutIcon} /> Logout
                </button>

            </div>
        </>
    );
}

const Leftnavdash = ({ username }: { username: String }) => {
    const navigate = useNavigate();
    const [isdashopen, setdash] = useState(false);

    const toggle = () => {
        setdash(isdashopen => !isdashopen);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    return (
        <>
            <div id="left-nav">
                <img src={fullLogo} alt="Logo" />

                <div id="profile-name">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 256 256"
                        width="32"
                        height="32"
                        xmlSpace="preserve"
                    >
                        <g transform="translate(1.4 1.4) scale(2.81 2.81)">
                            <path
                                d="M 45 0 C 20.147 0 0 20.147 0 45 c 0 24.853 20.147 45 45 45 s 45 -20.147 45 -45 C 90 20.147 69.853 0 45 0 z M 45 22.007 c 8.899 0 16.14 7.241 16.14 16.14 c 0 8.9 -7.241 16.14 -16.14 16.14 c -8.9 0 -16.14 -7.24 -16.14 -16.14 C 28.86 29.248 36.1 22.007 45 22.007 z M 45 83.843 c -11.135 0 -21.123 -4.885 -27.957 -12.623 c 3.177 -5.75 8.144 -10.476 14.05 -13.341 c 2.009 -0.974 4.354 -0.958 6.435 0.041 c 2.343 1.126 4.857 1.696 7.473 1.696 c 2.615 0 5.13 -0.571 7.473 -1.696 c 2.083 -1 4.428 -1.015 6.435 -0.041 c 5.906 2.864 10.872 7.591 14.049 13.341 C 66.123 78.957 56.135 83.843 45 83.843 z"
                                fill="black"
                            />
                        </g>
                    </svg>
                    <h1>{username}</h1>
                </div>

                <div id="links-left-nav-dash">
                    <Link onClick={toggle} className={` rounded-lg transition-all duration-500 ease-in-out px-4 py-2 ${isdashopen?"bg-[#0004]":"bg-none"}`} to=""> <img alt="" src={dashIcon} /> Dashboard <img alt="" className={`down-arrow transition-transform duration-500 !ml-auto ${isdashopen? "rotate-180 ":"hue-rotate-180"}`} src={downArrow} /></Link>
                    <div className={`flex  flex-col overflow-hidden transition-all duration-1000 ease-bounch  ${isdashopen?"max-h-56 opacity-100": "max-h-0 opacity-40"}`}>
                       {/* toggle content  */}
                       <Link className="!my-y !mx-6" to={"/seller/dashboard"}>Analytics</Link>
                       <Link className="!my-y !mx-6" to={"/seller/sales"}>Sales</Link>
                       <Link className="!my-y !mx-6" to={"/seller/upgrade"}>Product Analysis</Link>
                       <Link className="!my-y !mx-6" to={"/seller/upgrade"}>Advanced Analysis</Link>
                    </div>
                    <Link className="px-4 py-2" to="/seller/product"> <img alt="" src={productIcon} /> Product <img alt="" className={`down-arrow down-arrow transition-transform duration-500 !ml-auto ${false? "rotate-180 ":"hue-rotate-180"}`} src={downArrow} /></Link>
                    <Link className="px-4 py-2" to="/seller/inbox"><img alt="" src={securityIcon} />Inbox</Link>
                    <Link className="px-4 py-2" to="/seller/trade"><img alt="" src={logoutIcon} />Trade</Link>

                    <div id="links-left-nav-dash-bottom">
                        <Link className="px-4 py-2" to="/seller/support"><img alt="" src={helpIcon} />Help</Link>
                        <Link className="px-4 py-2" to="/seller/settings"><img alt="" src={SettingsIcon} />Settings</Link>
                        <button onClick={handleLogout} className="px-4 py-2 text-red-500 hover:text-red-700 transition-colors">
                            <img alt="" src={logoutIcon} />Logout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

const Layout = ({Body}: {Body: ReactNode}) =>{
    // Get user data from localStorage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const firstName = user?.firstName || 'User';

    return(
        <div className="layout">
            <Leftnavdash username={firstName}/>
            <div id="right-section">
                <Header/>
            {Body}
            </div>
        </div>
    );
};


export {Leftnav, Layout, Header };