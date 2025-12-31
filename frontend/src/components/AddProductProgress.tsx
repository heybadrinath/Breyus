import React from "react";

interface AddProductProgressProps {
    currentStep: number;
    totalSteps?: number;
    labels?: string[];
}

const defaultLabels = [
    "Product Info",
    "Media",
    "Pricing",
    "Tags",
    "Trade Terms",
    "Incoterms"
];

export const AddProductProgress: React.FC<AddProductProgressProps> = ({
    currentStep,
    totalSteps = 6,
    labels = defaultLabels
}) => {
    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="bg-[#282828] rounded-2xl px-8 py-6">
                {/* Step label - only show for current step */}
                <div className="flex justify-start mb-4">
                    <span className="text-white text-sm font-medium">
                        {labels[currentStep] || ""}
                    </span>
                </div>

                {/* Progress track */}
                <div className="relative flex items-center justify-between">
                    {/* Background line */}
                    <div className="absolute left-0 right-0 h-[2px] bg-gray-600 top-1/2 -translate-y-1/2" />

                    {/* Active line */}
                    <div
                        className="absolute left-0 h-[2px] bg-white top-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
                        style={{
                            width: `${(currentStep / (totalSteps - 1)) * 100}%`
                        }}
                    />

                    {/* Step dots */}
                    {Array.from({ length: totalSteps }).map((_, index) => (
                        <div
                            key={index}
                            className={`relative z-10 w-4 h-4 rounded-full transition-all duration-300 ${
                                index <= currentStep
                                    ? "bg-white"
                                    : "bg-gray-500"
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AddProductProgress;
