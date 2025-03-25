import React from "react";
import { Link } from "react-router-dom";
import "../seller/css/components.css";
import downArrow from "../seller/vectors/down-arrow.svg";
import notifications from "../seller/vectors/notifications.svg";
import fullLogo from "../seller/vectors/full-logo.svg"
import securityIcon from "../seller/vectors/security-icon.svg";
import logoutIcon from "../seller/vectors/logout-icon.svg";


const Header = () => {
    return (
        <>
            <header>
                <div id="left-header">
                    <div>sort: Last week</div>
                    <img src={downArrow} alt="Arrow" />
                </div>
                <div className="sa"></div>
                <div id="right-header">
                    <img src={notifications} alt="Notifications" />
                    <button>Try Breyus Core</button>
                </div>
            </header>
        </>
    );
};

const Leftnav = ({username}: {username: String}) => {
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

                <Link to="/seller/security"> <img src={securityIcon} /> Security</Link>
                <Link to="/"> <img src={logoutIcon} /> Logout</Link>
            </div>
        </>
    );
}


export { Header, Leftnav};