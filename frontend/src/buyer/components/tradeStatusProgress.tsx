import React from 'react';

interface ProgressProps {
  currentStep: number;
}

const TradeStatusProgress: React.FC<ProgressProps> = ({ currentStep }) => {
  const steps = [
    {
      id: 1,
      title: 'Seller Preferred',
      description: 'Awaiting Seller Response.',
      color: "#000"
    },
    {
      id: 2,
      title: 'Countered',
      description: 'Seller Submitted Counter Offer.',
      color: "#D45500"
    },
    {
      id: 3,
      title: 'Purchase Request Sent',
      description: 'Awaiting Seller Response.',
      color: "#0076D3"
    },
    {
      id: 4,
      title: 'Re-countered',
      description: 'You Responded to Counter Offer.',
      color: "#D45500"
    },
    {
      id: 5,
      title: 'Accepted',
      description: 'Terms Accepted  & Proceed to PO',
      color: "#117200"
    }
  ];


  return (
    <div className="flex flex-col items-start p-3">
      {steps.map((step, index) => (
        <div key={step.id} className="flex relative w-full mb-2">
          {index < steps.length - 1 && (
            <div className={`absolute left-[5px] top-[20px] h-[51px] border-l-2 border-dashed ${currentStep > step.id ? 'border-black' : 'border-gray-300'}`}></div>
          )}
          <div className="flex items-center z-10 my-[14px]">
            <div
              className={`w-3 h-3 rounded-full border-[2.8px] flex flex-col transition-all duration-500 ease-in-out
                ${currentStep >= step.id
                  ? 'bg-white border-black text-white'
                  : 'bg-white border-gray-300 text-gray-400'
                }`}
            >
            </div>
            <div className="ml-2 underline cursor-pointer">
              <h3 style={{ color: `${(step.color) ? step.color : '#000'}` }} className={`text-sm font-semibold ${currentStep >= step.id ? 'opacity-100' : 'opacity-50'}`}>
                {step.title}
              </h3>
              <p className={`text-xs absolute ${currentStep >= step.id ? 'text-gray-700' : 'text-gray-400'}`}>
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