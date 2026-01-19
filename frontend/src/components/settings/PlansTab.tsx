import React from "react";
import { CreditCard, Sparkles } from "lucide-react";

const PlansTab: React.FC = () => {
    return (
        <div className="w-full space-y-6">
            {/* Current Plan Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="h-6 w-6 text-gray-700" />
                    <h3 className="text-xl font-bold text-gray-800">Your Plan</h3>
                </div>

                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        Free Plan
                    </h4>
                    <p className="text-gray-500 max-w-md">
                        You are currently on the free plan. Premium plans with additional features will be available soon.
                    </p>
                </div>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-1">
                            Premium Plans Coming Soon
                        </h4>
                        <p className="text-gray-600 text-sm">
                            We're working on exciting premium features including advanced analytics,
                            priority support, and enhanced trade management capabilities.
                            Stay tuned for updates!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlansTab;
