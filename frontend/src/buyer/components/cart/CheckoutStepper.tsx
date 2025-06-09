import React from "react";
import { useNavigate } from "react-router-dom";

interface CheckoutStepperProps {
  currentStep: number;
}

const steps: { label: string; path: string }[] = [
  { label: "Cart", path: "/buyer/cartpage" },
  { label: "Address", path: "/buyer/buyer-address" },
  { label: "Purchase Request", path: "/buyer/purchase-request" },
  { label: "Purchase Order", path: "/checkout/purchase-order" },
  { label: "Payment", path: "/checkout/payment" },
];

const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center gap-8 py-4 mb-12 bg-black text-white text-lg font-semibold ">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <button
            type="button"
            onClick={() => {}}
            className={
              index <= currentStep
                ? "text-white underline focus:outline-none cursor-default transition-colors"
                : "text-gray-400 underline focus:outline-none cursor-default transition-colors"
            }
            style={{ background: "none", border: "none", padding: "0.5rem 1rem" }}
          >
            {step.label}
          </button>
          {index < steps.length - 1 && <span className="text-gray-500">----</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CheckoutStepper;