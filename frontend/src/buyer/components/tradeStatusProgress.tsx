import React from 'react';

interface ProgressProps {
  currentStep: number;
}

const TradeStatusProgress: React.FC<ProgressProps> = ({ currentStep }) => {
  const steps = [
    {
      id: 1,
      title: 'Seller Preferred',
      description: 'Awaiting Seller Response',
      color: "#000000"
    },
    {
      id: 2,
      title: 'Purchase Request Sent',
      description: 'Awaiting Seller Response',
      color: "#0076D3"
    },
    {
      id: 3,
      title: 'Countered',
      description: 'Seller Submitted Counter Offer',
      color: "#D45500"
    },
    {
      id: 4,
      title: 'Re-countered',
      description: 'You Responded to Counter Offer',
      color: "#D45500"
    },
    {
      id: 5,
      title: 'Accepted',
      description: 'Terms Accepted & Proceed to PO',
      color: "#117200"
    }
  ];

  return (
    <div className="flex flex-col p-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex relative">
          {/* Vertical dashed line */}
          {index < steps.length - 1 && (
            <div
              className={`absolute left-[5px] top-[18px] h-[45px] border-l-2 border-dashed ${
                currentStep > step.id ? 'border-gray-800' : 'border-gray-300'
              }`}
            />
          )}

          {/* Step content */}
          <div className="flex items-start py-2">
            {/* Circle indicator */}
            <div
              className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1 ${
                currentStep >= step.id
                  ? 'bg-white border-gray-800'
                  : 'bg-white border-gray-300'
              }`}
            />

            {/* Text content */}
            <div className="ml-3">
              <h3
                style={{ color: currentStep >= step.id ? step.color : '#9CA3AF' }}
                className={`text-sm font-semibold underline decoration-1 underline-offset-2 ${
                  currentStep >= step.id ? 'opacity-100' : 'opacity-60'
                }`}
              >
                {step.title}
              </h3>
              <p className={`text-xs mt-0.5 ${
                currentStep >= step.id ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {step.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TradeStatusProgress;




// export default TradeStatusProgress;