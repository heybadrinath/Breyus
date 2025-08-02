import { SearchHeaderLight } from "../../components/Header"
import { TradeTabs } from "../../components/tradeTabs";
import { PurchaseRequestWaitingList } from "../components/purchaseRequestWaitingList";
import { PurchaseOrderWaitingList } from "../components/purchaseOrderWaitingList";
import { OngoingTrades } from "../../components/ongoingTrades";


export const Trade = () => {
    return (
        <div className="h-screen flex flex-col" >
            <SearchHeaderLight />
            <TradeTabs tabContent={[<PurchaseRequestWaitingList />, <PurchaseOrderWaitingList />,<OngoingTrades />]} />
        </div>
    );
}