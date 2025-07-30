import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PurchaseRequestStatus } from "./purchaseRequestStatus";
import { PurchaseOrderStatus } from "./purchaseOrderStatus";
import { OngoingTrades } from "./ongoingTrades";

const tabs = [
    { id: 1, label: "Purchase Request Status" },
    { id: 2, label: "Purchase Order Status" },
    { id: 3, label: "Ongoing Trades" },
    { id: 4, label: "Track Trade" },
    { id: 5, label: "History" },
];

export const TradeTabs = () => {
    const [activeTab, setActiveTab] = React.useState(tabs[0].id);

    const renderContent = () => {
        switch (activeTab) {
            case 1:
                return <PurchaseRequestStatus />;
            case 2:
                return <PurchaseOrderStatus />;
            case 3:
                return <OngoingTrades />;
            default:
                return null;
        }
    }

    return (
        <div className="px-8 py-10 h-full">
            {/* Tabs */}
            <div className="flex border-b-2">
                <div className="flex gap-x-16 h-12 mx-auto text-xl font-bold text-gray-400">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative px-3 py-2.5 transition-colors duration-200 ${activeTab === tab.id ? "text-gray-700" : "hover:text-gray-600"
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-gray-700"
                                    layoutId="underline"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>
            {/* Tabs Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}