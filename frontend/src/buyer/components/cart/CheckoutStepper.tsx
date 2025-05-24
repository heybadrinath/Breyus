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
    <div className="flex items-center justify-center gap-6 py-4 bg-black text-white text-sm font-semibold">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <button
            type="button"
            onClick={() => navigate(step.path)}
            className={
              index <= currentStep
                ? "text-white underline focus:outline-none"
                : "text-gray-400 underline focus:outline-none"
            }
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
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