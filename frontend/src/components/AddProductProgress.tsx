import React from "react";
import {
    Circle,
    DollarSign,
    Image as ImageIcon,
    Package,
    ScrollText,
    Ship,
    Tag
} from "lucide-react";

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

const defaultStepIcons = [
    Package,
    ImageIcon,
    DollarSign,
    Tag,
    ScrollText,
    Ship
];

export const AddProductProgress: React.FC<AddProductProgressProps> = ({
    currentStep,
    totalSteps = 6,
    labels = defaultLabels
}) => {
    const steps = Array.from({ length: totalSteps }).map((_, index) => ({
        label: labels[index] || "",
        icon: defaultStepIcons[index] || Circle
    }));
    const maxIndex = Math.max(totalSteps - 1, 1);
    const progressPercent = Math.round((currentStep / maxIndex) * 100);
    const progressText = `Step ${Math.min(currentStep + 1, totalSteps)} of ${totalSteps}`;
    const trackInsetPercent = 100 / (2 * totalSteps);
    const trackWidthPercent = 100 - trackInsetPercent * 2;
    const activeWidthPercent = (currentStep / maxIndex) * trackWidthPercent;

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="bg-[#282828] rounded-2xl px-8 py-6">
                {/* Step label - only show for current step */}
                <div className="flex items-center justify-between mb-4">
                    <span className="text-white text-sm font-medium leading-none">
                        {steps[currentStep]?.label || ""}
                    </span>
                    <span className="text-gray-300 text-xs leading-none">
                        {progressText} • {progressPercent}%
                    </span>
                </div>

                {/* Progress track */}
                <div className="space-y-3">
                    <div className="flex items-end">
                        {steps.map((step, index) => {
                            const isCompleted = index < currentStep;
                            const isCurrent = index === currentStep;

                            return (
                                <div key={step.label + index} className="flex-1 text-center">
                                    <span
                                        className={`text-[11px] uppercase tracking-wide whitespace-nowrap ${
                                            isCompleted
                                                ? "text-white"
                                                : isCurrent
                                                    ? "text-[#C4A962]"
                                                    : "text-gray-400"
                                        }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="relative">
                        {/* Background line */}
                        <div
                            className="absolute h-[2px] bg-gray-600 top-1/2 -translate-y-1/2"
                            style={{ left: `${trackInsetPercent}%`, right: `${trackInsetPercent}%` }}
                        />

                        {/* Active line */}
                        <div
                            className="absolute h-[2px] bg-white top-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
                            style={{ left: `${trackInsetPercent}%`, width: `${activeWidthPercent}%` }}
                        />

                        {/* Step dots */}
                        <div className="flex items-center">
                            {steps.map((step, index) => {
                                const StepIcon = step.icon;
                                const isCompleted = index < currentStep;
                                const isCurrent = index === currentStep;

                                return (
                                    <div
                                        key={index}
                                        className="relative z-10 flex-1 flex justify-center"
                                        title={step.label}
                                    >
                                        <div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                isCompleted
                                                    ? "bg-white text-gray-900"
                                                    : isCurrent
                                                        ? "bg-[#C4A962] text-black ring-2 ring-[#E5D3A1]"
                                                        : "bg-gray-500 text-gray-200"
                                            }`}
                                        >
                                            <StepIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProductProgress;
