import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const tabs = [
    { id: 1, label: "PR Status", key: 'pr' },
    { id: 2, label: "PO Status", key: 'po' },
    { id: 3, label: "SPA Status", key: 'spa' },
    { id: 4, label: "Ongoing Trade", key: 'ongoing' },
    { id: 5, label: "Trade history", key: 'history' },
];

// Mapping from tab id to badge key
const tabIdToBadgeKey: Record<number, string> = {
    1: 'pr',
    2: 'po',
    3: 'spa',
    4: 'ongoing',
    5: 'history',
};

// Mapping from tab key to tab id
const tabKeyToId: Record<string, number> = {
    'pr': 1,
    'po': 2,
    'spa': 3,
    'ongoing': 4,
    'history': 5,
};

interface BadgeCounts {
    pr?: number;
    po?: number;
    spa?: number;
    ongoing?: number;
}

interface TradeTabsProps {
    tabContent: React.ReactNode[];
    badgeCounts?: BadgeCounts;
    onTabChange?: (tabId: number, tabKey: string) => void;
}

export const TradeTabs: React.FC<TradeTabsProps> = ({ tabContent, badgeCounts, onTabChange }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const tradeIdParam = searchParams.get('tradeId');

    // Determine initial tab from URL param
    const getInitialTab = () => {
        if (tabParam && tabKeyToId[tabParam]) {
            return tabKeyToId[tabParam];
        }
        return tabs[0].id;
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);

    // Initialize visited tabs to include the URL-specified tab
    const getInitialVisitedTabs = () => {
        const initial = new Set([1]); // Always include first tab
        if (tabParam && tabKeyToId[tabParam]) {
            initial.add(tabKeyToId[tabParam]);
        }
        return initial;
    };
    // Track which tabs have been visited (for lazy loading)
    const [visitedTabs, setVisitedTabs] = useState<Set<number>>(getInitialVisitedTabs);
    // Store the content reference to prevent recreation
    const contentRef = useRef(tabContent);

    // React to URL param changes (e.g., when navigating from another component on the same page)
    useEffect(() => {
        if (tabParam && tabKeyToId[tabParam]) {
            const newTabId = tabKeyToId[tabParam];
            setActiveTab(newTabId);
            // Mark this tab as visited
            if (!visitedTabs.has(newTabId)) {
                setVisitedTabs(prev => {
                    const newSet = new Set(Array.from(prev));
                    newSet.add(newTabId);
                    return newSet;
                });
            }
        }
    }, [tabParam]);

    const handleTabClick = (tabId: number) => {
        setActiveTab(tabId);
        // Mark this tab as visited so it stays mounted
        if (!visitedTabs.has(tabId)) {
            setVisitedTabs(prev => {
                const newSet = new Set(Array.from(prev));
                newSet.add(tabId);
                return newSet;
            });
        }

        // Update URL to reflect current tab
        const tabKey = tabIdToBadgeKey[tabId];
        const newParams = new URLSearchParams();
        newParams.set('tab', tabKey);
        // Preserve tradeId only if switching to SPA tab (where it's relevant)
        if (tabKey === 'spa' && tradeIdParam) {
            newParams.set('tradeId', tradeIdParam);
        }
        setSearchParams(newParams, { replace: true });

        // Notify parent of tab change
        if (onTabChange) {
            onTabChange(tabId, tabKey);
        }
    };

    // Get badge count for a tab
    const getBadgeCount = (tabId: number): number => {
        if (!badgeCounts) return 0;
        const key = tabIdToBadgeKey[tabId] as keyof BadgeCounts;
        return badgeCounts[key] || 0;
    };

    return (
        <div className="px-8 py-6 flex flex-col h-full overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b-2 flex-shrink-0">
                <div className="flex gap-x-16 h-12 mx-auto text-xl font-bold text-gray-400">
                    {tabs.map((tab) => {
                        const badgeCount = getBadgeCount(tab.id);
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`relative px-3 py-2.5 font-extrabold flex items-center gap-2 ${
                                    activeTab === tab.id ? "text-gray-800" : "hover:text-gray-700"
                                }`}
                            >
                                {tab.label}
                                {badgeCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                                        {badgeCount > 99 ? '99+' : badgeCount}
                                    </span>
                                )}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-gray-800" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            {/* Tabs Content - lazy load on first visit, keep mounted after */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {contentRef.current.map((content, index) => {
                    const tabId = index + 1;
                    const isVisited = visitedTabs.has(tabId);
                    const isActive = activeTab === tabId;

                    // Only render if tab has been visited
                    if (!isVisited) return null;

                    return (
                        <div
                            key={tabId}
                            className={`h-full overflow-y-scroll ${isActive ? 'block' : 'hidden'}`}
                            style={{ scrollbarGutter: 'stable' }}
                        >
                            {content}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}