import React from "react";

interface ProgressProps {
  currentStep: number;
}

export const PurchaseRequestProgress: React.FC<ProgressProps> = ({currentStep}) => {
    return (
        <div className="bg-black">
            <div className="flex w-[70%] mx-auto py-12">
                <div className="border border-gray-600 border-dashed w-full "></div>

                <div className="w-[70%] absolute top-9 flex">
                    <div className={`${currentStep >=1 ? 'opacity-100' : 'opacity-60'}`}>
                        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12.5" cy="12.5" r="12" transform="rotate(-90 12.5 12.5)" fill="black" stroke="white" />
                            <circle cx="12.5" cy="12.5" r="7" transform="rotate(-90 12.5 12.5)" fill="white" stroke="white" />
                        </svg>
                        <span className="text-white absolute bottom-7 translate-x-[-25px]">Negotiation</span>
                    </div>

                    <div className={`${currentStep >=2 ? 'opacity-100' : 'opacity-60'} ml-auto`}>
                        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12.5" cy="12.5" r="12" transform="rotate(-90 12.5 12.5)" fill="black" stroke="white" />
                            <circle cx="12.5" cy="12.5" r="7" transform="rotate(-90 12.5 12.5)" fill="white" stroke="white" />
                        </svg>
                        <span className="text-white absolute bottom-7 translate-x-[-20px] ">Address</span>
                    </div>

                    <div className={`${currentStep >=3 ? 'opacity-100' : 'opacity-60'} ml-auto`}>
                        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12.5" cy="12.5" r="12" transform="rotate(-90 12.5 12.5)" fill="black" stroke="white" />
                            <circle cx="12.5" cy="12.5" r="7" transform="rotate(-90 12.5 12.5)" fill="white" stroke="white" />
                        </svg>
                        <span className="text-white absolute bottom-7 translate-x-[-35px]">Trade Queries</span>
                    </div>

                    <div className={`${currentStep >=4 ? 'opacity-100' : 'opacity-60'} ml-auto`}>
                        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12.5" cy="12.5" r="12" transform="rotate(-90 12.5 12.5)" fill="black" stroke="white" />
                            <circle cx="12.5" cy="12.5" r="7" transform="rotate(-90 12.5 12.5)" fill="white" stroke="white" />
                        </svg>
                        <span className="text-white absolute bottom-7 translate-x-[-60px] text-nowrap">Select Payment Type</span>

                    </div>


                </div>
            </div>

        </div>
    );
}