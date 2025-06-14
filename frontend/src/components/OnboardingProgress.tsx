import React from 'react';

interface OnboardingProgressProps {
  currentStep: number;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ currentStep }) => {
  const steps = [
    {
      id: 1,
      title: 'Get Your Business Onboard',
      description: 'we need some key information before we proceed.',
    },
    {
      id: 2,
      title: 'Verification & Confirmation',
      description: 'The provider reviews and confirms your request.',
    },
    {
      id: 3,
      title: 'Tell Us About Your Business',
      description: 'Complete the fields below to get started with Breyus.',
    },
    {
      id: 4,
      title: 'Complete Your Busness Profile',
      description: 'Let\'s gather a few key details to personalize your experience.',
    },
    {
      id: 5,
      title: 'Tell us About Your Role',
      description: 'What is your role in the business? This helps us tailor your experience.',
    }
  ];

  return (
    <div className="flex flex-col items-start p-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex relative w-full mb-16">
          {index < steps.length - 1 && (
            <div className={`absolute left-[10px] top-[22px] h-[140px] border-l-2 border-dashed ${currentStep > step.id ? 'border-black' : 'border-gray-300'}`}></div>
          )}
          <div className="flex items-center z-10 my-[-1px]">
            <div
              className={`w-5 h-5 rounded-full border-4 flex items-center justify-center transition-all duration-500 ease-in-out
                ${currentStep >= step.id
                  ? 'bg-white border-black text-white'
                  : 'bg-white border-gray-300 text-gray-400'
                }`}
            >
              {/* {currentStep > step.id ? '✓' : step.id} */}
            </div>
            <div className="ml-4">
              <h3 className={`text-md font-semibold ${currentStep >= step.id ? 'text-black' : 'text-gray-500'}`}>
                {step.title}
              </h3>
              <p className={`text-sm ${currentStep >= step.id ? 'text-gray-700' : 'text-gray-400'}`}>
                {step.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OnboardingProgress; 