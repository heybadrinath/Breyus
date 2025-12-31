import React, { useState } from "react";

export interface Tab {
    id: string;
    label: string;
    component: React.ReactNode;
}

interface SettingsTabsProps {
    tabs: Tab[];
    defaultTab?: string;
}

const SettingsTabs: React.FC<SettingsTabsProps> = ({ tabs, defaultTab }) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

    const activeComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="w-full">
            {/* Tab Navigation */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-8 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-black text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="w-full">
                {activeComponent}
            </div>
        </div>
    );
};

export default SettingsTabs;
