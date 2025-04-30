import React from "react";

interface Step {
  label: string;
  isActive: boolean;
}

interface CheckoutStepperProps {
  currentStep: number;
}

const steps: string[] = [
  "Cart",
  "Address",
  "Purchase Request",
  "Purchase Order",
  "Payment",
];

const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-center gap-6 py-4 bg-black text-white text-sm font-semibold">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <span
            className={
              index === currentStep
                ? "text-white"
                : "text-gray-400"
            }
          >
            {step}
          </span>
          {index < steps.length - 1 && <span className="text-gray-500">----</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CheckoutStepper;