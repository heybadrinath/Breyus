import React from "react";
import { SearchHeaderLight } from "../../components/Header"
import { TradeTabs } from "../components/tradeTabs";
import { PurchaseRequestStatus } from "../components/purchaseRequestStatus";
import { PurchaseOrderStatus } from "../components/purchaseOrderStatus";
import { OngoingTrades } from "../components/ongoingTrades";


export const Trade = () => {
    return (
        <div className="h-screen flex flex-col" >
            <SearchHeaderLight />
            <TradeTabs tabContent={[<PurchaseRequestStatus />, <PurchaseOrderStatus />, <OngoingTrades />]} />
        </div>
    );
}