import React, { useState } from "react";
import { PurchaseRequestProgress } from "../components/purchaseRequestProgress";
import { Negoatation } from "../components/Negotation";
import { Address } from "../components/Address";
import { TradeQueries } from "../components/TradeQueries";
import { Payment } from "../components/Payment";

export const PurchaseRequest = () => {

    const [step, setStep] = useState(1);
    const handleStep = (step: number) => {
        setStep(step);
    };

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const renderStep = () => {
        switch (step) {
            case 1:
                return <Negoatation handlestep={handleStep} currentStep={step} productId={productId as string} />;
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