import React from "react";
import { SearchHeaderLight } from "../../components/Header"
import { TradeTabs } from "../components/tradeTabs";
import { Filter } from "lucide-react";


export const Trade = () => {
    return (
        <div className="h-screen flex flex-col" >
            <SearchHeaderLight />
            <TradeTabs />
        </div>
    );
}