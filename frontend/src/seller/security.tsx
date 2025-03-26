import React from "react";
import {Leftnavdash,Header} from "../seller/components";
import "../seller/css/components.css";
import "../seller/css/security.css";
let username = "Demo User";

const SecuritySection = () => {
    return(
        <div id="security-section">
            <h1>Security</h1>
            <hr />
        </div>
    );
};


const Security = () => {
    return(<div className="layout">
        <Leftnavdash username={username} />
        <div id="right-section">
            <Header />
            <SecuritySection/>

        </div>
    </div>);
};

export default Security;