import React, { useState, useEffect } from 'react';
import SelectField from '../../components/SelectField';
import ComboboxDropdown, { ComboboxOption } from '../../components/ui/ComboboxDropdown';
import { getPorts, getCountries, getCurrencies, Port, Country, Currency } from '../../services/content.service';
import { Ship, Plane, Truck } from 'lucide-react';

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

    // Admin-controlled content state
    const [ports, setPorts] = useState<Port[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [portsLoading, setPortsLoading] = useState(true);
    const [countriesLoading, setCountriesLoading] = useState(true);
    const [currenciesLoading, setCurrenciesLoading] = useState(true);

    // Fetch admin-controlled content on mount
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const [portsData, countriesData, currenciesData] = await Promise.all([
                    getPorts(),
                    getCountries(),
                    getCurrencies()
                ]);
                setPorts(portsData);
                setCountries(countriesData);
                setCurrencies(currenciesData);
            } catch (error) {
                console.error('Failed to fetch content:', error);
            } finally {
                setPortsLoading(false);
                setCountriesLoading(false);
                setCurrenciesLoading(false);
            }
        };
        fetchContent();
    }, []);

    // Convert ports to ComboboxOptions grouped by type
    const portOptions: ComboboxOption[] = ports.map(port => {
        const countryName = typeof port.country === 'string'
            ? port.country
            : (port.country as Country)?.name || '';
        const typeLabel = port.type === 'sea' ? 'Sea Port' : port.type === 'air' ? 'Airport' : 'Land Port';
        return {
            value: port.code,
            label: `${port.name} (${port.code})`,
            subLabel: `${countryName} • ${typeLabel}`,
            group: typeLabel,
            icon: port.type === 'sea' ? <Ship className="w-4 h-4" /> : port.type === 'air' ? <Plane className="w-4 h-4" /> : <Truck className="w-4 h-4" />,
            data: port
        };
    });

    // Convert countries to ComboboxOptions
    const countryOptions: ComboboxOption[] = countries.map(country => ({
        value: country.name,
        label: `${country.flagEmoji || ''} ${country.name}`.trim(),
        subLabel: country.continent,
        group: country.continent,
        data: country
    }));




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
                    <label className="block font-medium mb-2">
                        Enter export location of this product <span className="text-red-500">*</span>
                    </label>
                    <ComboboxDropdown
                        options={countryOptions}
                        value={tradeTerms.exportLocation}
                        onChange={(value) => setTradeTerms(prev => ({ ...prev, exportLocation: value }))}
                        placeholder="Search for a country..."
                        loading={countriesLoading}
                        grouped={true}
                        allowCustom={true}
                        showCustomWarning={true}
                        customWarningMessage="This country is not in our standard list"
                        emptyMessage="No countries found"
                    />
                </div>

                <div>
                    <label className="block font-medium mb-2">
                        Enter your nearest exporting port <span className="text-red-500">*</span>
                    </label>
                    <ComboboxDropdown
                        options={portOptions}
                        value={tradeTerms.nearestPort}
                        onChange={(value) => setTradeTerms(prev => ({ ...prev, nearestPort: value }))}
                        placeholder="Search for a port (e.g., INMUN, INNSA)..."
                        loading={portsLoading}
                        grouped={true}
                        allowCustom={true}
                        showCustomWarning={true}
                        customWarningMessage="This port is not in our standard list"
                        emptyMessage="No ports found. Try a different search or enter custom value."
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
                            {currenciesLoading ? (
                                <option value="">Loading...</option>
                            ) : currencies.length === 0 ? (
                                <>
                                    <option value="USD">USD</option>
                                    <option value="INR">INR</option>
                                </>
                            ) : (
                                currencies.map(currency => (
                                    <option key={currency._id} value={currency.code}>
                                        {`${currency.code} ${currency.symbol}`}
                                    </option>
                                ))
                            )}
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
