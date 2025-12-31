import React from "react";
import { SearchHeaderLight } from "../../components/Header"
import { TradeTabs } from "../../components/tradeTabs";
import { PurchaseRequestStatus } from "../components/purchaseRequestStatus";
import { PurchaseOrderStatus } from "../components/purchaseOrderStatus";
import { SellerSPAStatus } from "../components/SPAStatus";
import { OngoingTrades } from "../../components/ongoingTrades";
import TradeHistory from "../../components/TradeHistory";


export const Trade = () => {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <SearchHeaderLight />
            <div className="flex-1 min-h-0">
                <TradeTabs tabContent={[
                    <PurchaseRequestStatus />,
                    <PurchaseOrderStatus />,
                    <SellerSPAStatus />,
                    <OngoingTrades />,
                    <TradeHistory isSeller={true} />
                ]} />
            </div>
        </div>
    );
}
