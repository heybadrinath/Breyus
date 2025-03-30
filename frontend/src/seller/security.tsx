import React from "react";
import {Layout} from "../seller/components";
import "../seller/css/components.css";
import "../seller/css/security.css";


const SecuritySection = () => {
    return(
        <div id="security-section">
            <h1>Security</h1>
            <hr />
        </div>
    );
};


const Security = () => {
    return(
        <Layout Body={<SecuritySection/>}/>
    );
};

export default Security;