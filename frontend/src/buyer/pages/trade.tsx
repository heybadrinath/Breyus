import React, { useState, useEffect, useCallback, useRef } from "react";
import { SearchHeaderLight } from "../../components/Header"
import { TradeTabs } from "../../components/tradeTabs";
import { PurchaseRequestWaitingList } from "../components/purchaseRequestWaitingList";
import { PurchaseOrderWaitingList } from "../components/purchaseOrderWaitingList";
import { BuyerSPAStatus } from "../components/SPAStatus";
import { OngoingTrades } from "../../components/ongoingTrades";
import TradeHistory from "../../components/TradeHistory";
import { getUnreadCounts, markTradesAsRead } from "../../services/trade.service";

interface BadgeCounts {
    pr?: number;
    po?: number;
    spa?: number;
    ongoing?: number;
}

export const Trade = () => {
    const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({});
    // Issue #7 - Track fetch version to prevent stale data overwrites
    const fetchVersionRef = useRef(0);
    const optimisticUpdateRef = useRef<Set<string>>(new Set());

    // Fetch unread counts on mount
    const fetchUnreadCounts = useCallback(async () => {
        const currentVersion = ++fetchVersionRef.current;
        try {
            const response = await getUnreadCounts();
            // Issue #7 - Only update if this is still the latest fetch
            // and don't overwrite tabs with pending optimistic updates
            if (response.statusCode === 200 && response.data && currentVersion === fetchVersionRef.current) {
                setBadgeCounts(prev => {
                    const newCounts = { ...response.data };
                    // Preserve optimistic updates (tabs marked as 0)
                    optimisticUpdateRef.current.forEach(tabKey => {
                        if (tabKey in newCounts) {
                            newCounts[tabKey as keyof BadgeCounts] = 0;
                        }
                    });
                    return newCounts;
                });
            }
        } catch (error) {
            console.error('Failed to fetch unread counts:', error);
        }
    }, []);

    useEffect(() => {
        fetchUnreadCounts();
        // Cleanup optimistic updates after component mounts
        return () => {
            optimisticUpdateRef.current.clear();
        };
    }, [fetchUnreadCounts]);

    // Handle tab change - mark trades as read for that tab
    const handleTabChange = useCallback(async (tabId: number, tabKey: string) => {
        const validTabTypes = ['pr', 'po', 'spa', 'ongoing'];
        if (validTabTypes.includes(tabKey)) {
            // Issue #7 - Track optimistic update
            optimisticUpdateRef.current.add(tabKey);
            // Optimistic update immediately
            setBadgeCounts(prev => ({
                ...prev,
                [tabKey]: 0
            }));

            try {
                await markTradesAsRead(tabKey as 'pr' | 'po' | 'spa' | 'ongoing' | 'history');
                // Clear optimistic tracking after successful mark
                // Use timeout to prevent race with any in-flight fetch
                setTimeout(() => {
                    optimisticUpdateRef.current.delete(tabKey);
                }, 1000);
            } catch (error) {
                console.error('Failed to mark trades as read:', error);
                // On error, clear optimistic tracking and refetch
                optimisticUpdateRef.current.delete(tabKey);
                fetchUnreadCounts();
            }
        }
    }, [fetchUnreadCounts]);

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                <SearchHeaderLight />
            </div>
            <div className="flex-1 min-h-0">
                <TradeTabs
                    tabContent={[
                        <PurchaseRequestWaitingList />,
                        <PurchaseOrderWaitingList />,
                        <BuyerSPAStatus />,
                        <OngoingTrades />,
                        <TradeHistory isSeller={false} />
                    ]}
                    badgeCounts={badgeCounts}
                    onTabChange={handleTabChange}
                />
            </div>
        </div>
    );
}
