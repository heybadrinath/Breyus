import React from "react";
import {Header,Leftnavdash} from "../seller/components";

let username = "Demo user"

const SellerDashboard = () => {
  return(
    <div className="layout">
                    <Leftnavdash username={username} />
                    <div id="right-section">
                        <Header />
                    </div>
                </div>
  );
};

export default SellerDashboard;
