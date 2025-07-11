import React, { useEffect } from "react";
import Switch from 'react-switch';

interface PriceProps {
  priceData: {
    price: string;
    currency: string;
    sku: string;
    onSale: boolean;
    discount: string;
    salePrice: string;
    costOfGoods: string;
    profit: string;
    pricing: string;
    margin: string;
  };
  setPriceData: React.Dispatch<React.SetStateAction<{
    price: string;
    currency: string;
    sku: string;
    onSale: boolean;
    discount: string;
    salePrice: string;
    costOfGoods: string;
    profit: string;
    pricing: string;
    margin: string;
  }>>;
}

// Price Component
const Price: React.FC<PriceProps> = ({ priceData, setPriceData }) => {

  const toggleSale = () => {
    setPriceData(prev => ({
      ...prev,
      onSale: !prev.onSale
    }));
  };


  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setPriceData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  useEffect(() => {
    const newPricing = priceData.onSale ? priceData.salePrice : priceData.price;
    setPriceData(prev => ({
      ...prev,
      pricing: newPricing
    }));
  }, [priceData.onSale, priceData.price, priceData.salePrice]);

  useEffect(() => {
    const salePrice = Number(priceData.price) - (Number(priceData.discount.replace('%', '')) / 100) * Number(priceData.price);
    setPriceData(prev => ({
      ...prev,
      salePrice: (priceData.onSale) ? String(salePrice) : ''
    }))
  }, [priceData.price, priceData.salePrice, priceData.discount]);

  useEffect(() => {
    if (priceData.pricing && priceData.costOfGoods) {
      const profit = Number(priceData.pricing) - Number(priceData.costOfGoods);
      setPriceData(prev => ({
        ...prev,
        profit: String(profit),
      }))
    }

  }, [priceData.pricing, priceData.costOfGoods, priceData.profit]);

  useEffect(() => {
    if (priceData.pricing && priceData.profit) {
      const margin = (Number(priceData.profit) / Number(priceData.pricing)) * 100;
      setPriceData(prev => ({
        ...prev,
        margin: String(margin) + '%',
      }))
    }

  }, [priceData.pricing, priceData.margin, priceData.profit]);





  return (
    <div>
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">Pricing</h1>

        <div className="product-card animate-slide-in shadow-none">
          {/* Section-1 */}
          <div className="price-container grid-cols-3">
            <div className="form-field">
              <input
                placeholder="Price"
                type="text"
                name="price"
                value={priceData.price}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            <div className="form-field">
              <select
                className="w-full"
                name="currency"
                value={priceData.currency}
                onChange={handleChange}
              >
                <option value="USD">INR</option>
                <option value="INR">USR</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="form-field">
              <input
                placeholder="SKU"
                type="text"
                name="sku"
                value={priceData.sku}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Section -2  */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Discounts</h2>
            <div className="flex items-center my-2">
              <span className="mr-2 text-sm text-gray-700 ml-2 my-auto">On Sale</span>
              <Switch
                onChange={toggleSale}
                checked={priceData.onSale}
                offColor="#8b8b8b"
                onColor="#8b8b8b"
                offHandleColor="#fff"
                onHandleColor="#000"
                uncheckedIcon={false}
                checkedIcon={false}
                className="focus:!outline-none"
              />

            </div>
          </div>

          <div className="price-container grid-cols-2">
            <div className="form-field">
              <input
                placeholder="Discount %"
                type="text"
                name="discount"
                value={priceData.discount}
                onChange={handleChange}
                disabled={!priceData.onSale}
                className={`w-full ${!priceData.onSale ? 'opacity-50' : ''}`}
                onBlur={() => {
                  if (!priceData.discount.endsWith('%')) {

                    setPriceData(prev => ({
                      ...prev,
                      discount: priceData.discount + '%',
                    }))
                  }
                }}
              />
            </div>
            <div className="form-field">
              <input
                placeholder="Sale Price"
                type="text"
                name="salePrice"
                value={priceData.salePrice}
                onChange={handleChange}
                disabled={!priceData.onSale}
                readOnly
                className={`w-full ${!priceData.onSale ? 'opacity-50' : ''}`}
              />
            </div>
          </div>

          {/* Section -3 */}
          <h2 className="text-lg font-semibold mb-2">Inventory & Profit</h2>
          <div className="flex flex-row w-full">


            {/* <div className="flex w-16 bg-gray-500 h-1 my-auto rounded-full"></div> */}

            <div className="form-field w-full mx-3">
              <input
                placeholder="Cost of Goods"
                type="text"
                name="costOfGoods"
                value={priceData.costOfGoods}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            {/* <div className="flex w-16  h-3 border-b-[3px] border-t-[3px] border-gray-500 my-auto rounded-sm "></div> */}

            <div className="form-field w-full mx-3">
              <input
                placeholder="Profit"
                type="text"
                name="profit"
                value={priceData.profit}
                readOnly
                className="w-full bg-gray-50"
              />
            </div>

            <div className="form-field w-full mx-3">
              <input
                placeholder="margin"
                type="text"
                name="margin"
                value={priceData.margin}
                readOnly
                className="w-full mx-auto bg-gray-50"
              />
            </div>

          </div>


        </div>
      </div>
    </div>
  );
};

export default Price;