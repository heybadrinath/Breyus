import React, { useState } from 'react';
import productService from '../services/product.service';

export default function SellerTradeTerms() {
    const [form, setForm] = useState({
        revenueMin: '',
        revenueMax: '',
        currency: 'USD',
        unit: 'Crore',
        yearsTrade: '',
        industry: '',
        marketYears: '',
        sellerMarketYears: '',
        marketcapture: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load product data from localStorage
    const getProductData = () => {
        try {
            const data = localStorage.getItem('productFormData');
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    };

    // Map trade terms form to backend fields
    const getTradeTermsFields = () => {
        return {
            preferred_buyer_revenue_range: form.revenueMin && form.revenueMax ? `${form.revenueMin}-${form.revenueMax} ${form.currency} ${form.unit}` : '',
            potential_years_to_trade: form.yearsTrade,
            industry_using_product: form.industry,
            years_in_market: form.marketYears,
            buyer_market_duration: form.sellerMarketYears,
            market_capture: form.marketcapture ? parseFloat(form.marketcapture) : undefined,
        };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const productData = getProductData();
        if (!productData) {
            setError('Product data not found. Please restart the product creation process.');
            setLoading(false);
            return;
        }
        const tradeTerms = getTradeTermsFields();
        const finalData = { ...productData, ...tradeTerms };
        try {
            const result = await productService.createProduct(finalData);
            if (result.success) {
                localStorage.removeItem('productFormData');
                window.location.href = '/seller/inventory';
            } else {
                setError(result.message || 'Failed to add product.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="p-6 space-y-6 max-w-2xl mx-auto" onSubmit={handleSubmit}>
            <div>
                <label className="block font-medium">
                    What’s your preferred buyer revenue range? <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2 mt-2">
                    <input
                        type="number"
                        name="revenueMin"
                        value={form.revenueMin}
                        onChange={handleChange}
                        placeholder="From"
                        className="border p-2 rounded w-24"
                    />
                    <span>To</span>
                    <input
                        type="number"
                        name="revenueMax"
                        value={form.revenueMax}
                        onChange={handleChange}
                        placeholder="To"
                        className="border p-2 rounded w-24"
                    />
                    <select
                        name="currency"
                        value={form.currency}
                        onChange={handleChange}
                        className="border p-2 rounded"
                    >
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                    </select>
                    <select
                        name="unit"
                        value={form.unit}
                        onChange={handleChange}
                        className="border p-2 rounded"
                    >
                        <option value="Crore">Crore</option>
                        <option value="Million">Million</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block font-medium">
                    How many potential years you want to trade with buyer? <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    name="yearsTrade"
                    value={form.yearsTrade}
                    onChange={handleChange}
                    className="border p-2 mt-2 w-full rounded"
                />
            </div>

            <div>
                <label className="block font-medium">Which industry uses your product?</label>
                <input
                    type="text"
                    name="industry"
                    value={form.industry}
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
                    value={form.marketYears}
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
                    value={form.sellerMarketYears}
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
                    value={form.marketcapture}
                    onChange={handleChange}
                    className="border p-2 mt-2 w-full rounded"
                    placeholder='  %'
                />
            </div>

            {error && <div className="text-red-600 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}
            <button type="submit" className='bg-black text-white px-6 py-2' disabled={loading}>
                {loading ? 'Adding Product...' : 'Add Product'}
            </button>
        </form>
    );
}
