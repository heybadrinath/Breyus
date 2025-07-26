import React, { useState } from "react";
import { PurchaseRequestProgress } from "../components/purchaseRequestProgress";
import { Negoatation } from "../components/Negotation";
import { Address } from "../components/Address";
import { TradeQueries } from "../components/TradeQueries";
import { Payment } from "../components/Payment";

export const PurchaseRequest = () => {

    const [step, setStep] = useState(2);

    const handleStep = (step: number) => {
    setStep(step);
  };


    const renderStep = () => {
        switch (step) {
            case 1:
                return <Negoatation />;
            case 2:
                return <Address handlestep={handleStep} currentStep={step} />;
            case 3:
                return <TradeQueries handlestep={handleStep} currentStep={step} />;
            case 4:
                return <Payment handlestep={handleStep} currentStep={step} />;
            default:
                return null;
        }
    }

    return (
        <div className="flex flex-col h-screen"> 
            <PurchaseRequestProgress currentStep={step} />
            {renderStep()}
        </div>
    );
}