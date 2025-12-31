import React from 'react';
import Sidebar from '../../components/Sidebar';

interface TradeSkeletonProps {
    isSeller: boolean;
}

const TradeSkeleton: React.FC<TradeSkeletonProps> = ({ isSeller }) => {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar Seller={isSeller} />

            <div className="flex-1 overflow-y-auto">
                {/* Header Skeleton */}
                <div className="bg-white border-b sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
                                <div>
                                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                            <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-3 gap-6">
                        {/* Left Column Skeleton */}
                        <div className="col-span-1 space-y-6">
                            {/* Product Card Skeleton */}
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="aspect-video bg-gray-200 animate-pulse" />
                                <div className="p-4 space-y-3">
                                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                                    <div className="pt-3 border-t">
                                        <div className="flex justify-between">
                                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Card Skeleton */}
                            <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
                                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3" />
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* Middle Column Skeleton */}
                        <div className="col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                                <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-6" />
                                
                                {/* Status Box Skeleton */}
                                <div className="h-24 w-full bg-gray-100 rounded-lg animate-pulse mb-6" />
                                
                                {/* Form Field Skeletons */}
                                <div className="space-y-4">
                                    <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
                                    <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
                                    <div className="h-24 w-full bg-gray-200 rounded-lg animate-pulse" />
                                </div>

                                {/* Action Button Skeletons */}
                                <div className="space-y-3 mt-6">
                                    <div className="h-12 w-full bg-gray-300 rounded-lg animate-pulse" />
                                    <div className="flex gap-3">
                                        <div className="h-12 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                                        <div className="h-12 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column (History) Skeleton */}
                        <div className="col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-4 space-y-4">
                                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                        <div className="h-16 w-full bg-gray-100 rounded-lg animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradeSkeleton;
