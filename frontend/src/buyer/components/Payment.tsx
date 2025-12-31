import React from "react";
import { Info } from "lucide-react";
import { PaymentMethod } from "../../services/trade.service";

interface PaymentProps {
    handlestep: (step: number) => void;
    currentStep: number;
    onDataChange: (data: any) => void;
    stepData: any;
    onSubmit: () => void;
    // Lifted state props
    selectedPaymentType: 'advance' | 'credit' | 'openAccount' | '';
    paymentDetails: {
        percentage: string;
        days: string;
    };
    onPaymentTypeChange: (type: 'advance' | 'credit' | 'openAccount') => void;
    onPaymentDetailsChange: (details: { percentage: string; days: string }) => void;
}

export const Payment: React.FC<PaymentProps> = ({ 
    handlestep, 
    currentStep, 
    onDataChange, 
    stepData, 
    onSubmit,
    selectedPaymentType,
    paymentDetails,
    onPaymentTypeChange,
    onPaymentDetailsChange
}) => {
    const handleSubmit = () => {
        if (!selectedPaymentType) {
            alert('Please select a payment method');
            return;
        }

        if (selectedPaymentType === 'advance' && !paymentDetails.percentage) {
            alert('Please enter the advance payment percentage');
            return;
        }

        if ((selectedPaymentType === 'credit' || selectedPaymentType === 'openAccount') && !paymentDetails.days) {
            alert('Please enter the credit period');
            return;
        }

        onSubmit();
    };

    return (
        <div className="flex flex-col my-auto mx-auto w-[50%]">
            <h1 className="text-3xl font-semibold text-black mb-3">Choose Mode of Payment</h1>
            <div className="flex flex-col w-full border-2 rounded-lg px-8 py-6 gap-y-12" >
                <div className="flex w-full">
                    <input
                        type="radio"
                        id="advancePayment"
                        name="paymentOption"
                        className="form-radio h-5 w-5 text-black my-auto mr-3"
                        checked={selectedPaymentType === 'advance'}
                        onChange={() => onPaymentTypeChange('advance')}
                    />

                    <div className="border p-4 rounded-lg w-full">
                        <div className="flex">
                            <label className="font-medium text-2xl inline">Advance payment via (RTGS)</label> 
                            <Info className="inline ml-auto cursor-pointer" />
                        </div>
                        <input
                            type="text"
                            name="percentage"
                            className="border p-2 mt-2 w-fit rounded"
                            placeholder="45%"
                            value={paymentDetails.percentage}
                            onChange={(e) => onPaymentDetailsChange({...paymentDetails, percentage: e.target.value})}
                            disabled={selectedPaymentType !== 'advance'}
                        />
                    </div>
                </div>

                <div className="flex w-full">
                    <input
                        type="radio"
                        id="creditPayment"
                        name="paymentOption"
                        className="form-radio h-5 w-5 text-black my-auto mr-3"
                        checked={selectedPaymentType === 'credit'}
                        onChange={() => onPaymentTypeChange('credit')}
                    />

                    <div className="border p-4 rounded-lg w-full">
                        <div className="flex">
                            <label className="font-medium text-2xl inline">Credits Period via (Letter of Credit)</label> 
                            <Info className="inline ml-auto cursor-pointer" />
                        </div>
                        <input
                            type="text"
                            name="days"
                            className="border p-2 mt-2 w-fit rounded"
                            placeholder="10 Days"
                            value={paymentDetails.days}
                            onChange={(e) => onPaymentDetailsChange({...paymentDetails, days: e.target.value})}
                            disabled={selectedPaymentType !== 'credit'}
                        />
                    </div>
                </div>

                <div className="flex w-full">
                    <input
                        type="radio"
                        id="openAccountPayment"
                        name="paymentOption"
                        className="form-radio h-5 w-5 text-black my-auto mr-3"
                        checked={selectedPaymentType === 'openAccount'}
                        onChange={() => onPaymentTypeChange('openAccount')}
                    />

                    <div className="border p-4 rounded-lg w-full">
                        <div className="flex">
                            <label className="font-medium text-2xl inline">Open Account via (RTGS)</label> 
                            <Info className="inline ml-auto cursor-pointer" />
                        </div>
                        <input
                            type="text"
                            name="days"
                            className="border p-2 mt-2 w-fit rounded"
                            placeholder="20 Days"
                            value={paymentDetails.days}
                            onChange={(e) => onPaymentDetailsChange({...paymentDetails, days: e.target.value})}
                            disabled={selectedPaymentType !== 'openAccount'}
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-between">
                    <button
                        onClick={() => handlestep(currentStep - 1)}
                        type="button"
                        className=" bg-gradient-to-r from-[#e7e7e7] to-[#ffffff] border-2 text-black px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-[#e1e2e4] hover:to-[#f8fafc] hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleSubmit}
                        type="button"
                        className=" ml-auto bg-gradient-to-r from-[#5e5959] to-[black] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-gray-600 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Send Purchase Request
                    </button>
                </div>
            </div>
        </div>
    )
}