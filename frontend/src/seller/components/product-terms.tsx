import React, { useState } from 'react';
import SelectField from '../../components/SelectField';

interface TradeTermsProp {
    tradeTerms: {
        exportLocation: string;
        nearestPort: string;
        revenueMin: string;
        revenueMax: string;
        currency: string;
        unit: string;
        paymentTerms: string;
        logisticsTerms: string;
        popTerms: string;
        yearsTrade: string;
        industry: string;
        marketYears: string;
        sellerMarketYears: string;
        marketcapture: string;
    };
    setTradeTerms: React.Dispatch<React.SetStateAction<{
        exportLocation: string;
        nearestPort: string;
        revenueMin: string;
        revenueMax: string;
        currency: string;
        unit: string;
        paymentTerms: string;
        logisticsTerms: string;
        popTerms: string;
        yearsTrade: string;
        industry: string;
        marketYears: string;
        sellerMarketYears: string;
        marketcapture: string;
    }>>;
}

const SellerTradeTerms: React.FC<TradeTermsProp> = ({tradeTerms, setTradeTerms}) => {
   
    const [loading, setLoading] = useState(false);




    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTradeTerms((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      

    };

    return (
        <div className=" px-3 space-y-3">
            <h1 className='section-title font-bold mb-6 text-2xl'>Preffered Product Terms</h1>
            <div className='product-card'>
                <div>
                    <label className="block font-medium">
                        Enter export location of this product <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="exportLocation"
                        value={tradeTerms.exportLocation}
                        onChange={handleChange}
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        Enter your nearest exporting port <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="nearestPort"
                        value={tradeTerms.nearestPort}
                        onChange={handleChange}
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        What's your preferred buyer revenue range? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-2 mt-2">
                        <input
                            type="number"
                            name="revenueMin"
                            value={tradeTerms.revenueMin}
                            onChange={handleChange}
                            placeholder="From"
                            className="border p-2 rounded w-24"
                        />
                        <span>To</span>
                        <input
                            type="number"
                            name="revenueMax"
                            value={tradeTerms.revenueMax}
                            onChange={handleChange}
                            placeholder="To"
                            className="border p-2 rounded w-24"
                        />
                        <SelectField
                            name="currency"
                            value={tradeTerms.currency}
                            onChange={handleChange}
                            className="select-field--sm"
                        >
                            <option value="USD">USD</option>
                            <option value="INR">INR</option>
                        </SelectField>
                        <SelectField
                            name="unit"
                            value={tradeTerms.unit}
                            onChange={handleChange}
                            className="select-field--sm"
                        >
                            <option value="Crore">Crore</option>
                            <option value="Million">Million</option>
                        </SelectField>
                    </div>
                </div>

                <div>
                    <label className="block font-medium">
                        What's your Payment, Bank and Insurance terms <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="paymentTerms"
                        value={tradeTerms.paymentTerms}
                        onChange={handleChange}
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        What's your Delivery/Logistics terms <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="logisticsTerms"
                        value={tradeTerms.logisticsTerms}
                        onChange={handleChange}
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        What's your POP (proof of product) terms <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="popTerms"
                        value={tradeTerms.popTerms}
                        onChange={handleChange}
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        How many potential years you want to trade with buyer? <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="yearsTrade"
                        value={tradeTerms.yearsTrade}
                        onChange={handleChange}
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        Which industry uses your product? <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="industry"
                        value={tradeTerms.industry}
                        onChange={handleChange}
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        How long have you been in the market? <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="marketYears"
                        value={tradeTerms.marketYears}
                        onChange={handleChange}
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        How long you want to have your buyer to be in the market? <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="sellerMarketYears"
                        value={tradeTerms.sellerMarketYears}
                        onChange={handleChange}
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        What is your market capture?
                    </label>
                    <input
                        type="text"
                        name="marketcapture"
                        value={tradeTerms.marketcapture}
                        onChange={handleChange}
                        className="border p-2 mt-2 w-full rounded"
                        placeholder='  %'
                    />
                </div>

            </div>
        </div>
    );
}

export default SellerTradeTerms;
