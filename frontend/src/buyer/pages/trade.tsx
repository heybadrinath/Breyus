import React from "react";
import { SearchHeaderLight } from "../../components/Header"
import { TradeTabs } from "../../components/tradeTabs";
import { PurchaseRequestWaitingList } from "../components/purchaseRequestWaitingList";
import { PurchaseOrderWaitingList } from "../components/purchaseOrderWaitingList";
import { BuyerSPAStatus } from "../components/SPAStatus";
import { OngoingTrades } from "../../components/ongoingTrades";
import TradeHistory from "../../components/TradeHistory";


export const Trade = () => {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <SearchHeaderLight />
            <div className="flex-1 min-h-0">
                <TradeTabs tabContent={[
                    <PurchaseRequestWaitingList />,
                    <PurchaseOrderWaitingList />,
                    <BuyerSPAStatus />,
                    <OngoingTrades />,
                    <TradeHistory isSeller={false} />
                ]} />
            </div>
        </div>
    );
}
