import React from "react";

// Price Component
const Price = () => {
  
  
  return (
    <div>
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">Price</h1>

        <div className="product-card animate-slide-in shadow-none">
          {/* Section-1 */}
          <h2 className="text-lg font-semibold mb-2">Basic Pricing</h2>
          <div className="price-container grid-cols-3">
            <div className="form-field">
              <input
                placeholder="Price"
                type="text"
                name="price"
                // value={priceData.price}
                // onChange={handleChange}
                className="w-full"
              />
            </div>
            <div className="form-field">
              <select
                className="w-full"
                name="currency"
                // value={priceData.currency}
                // onChange={handleChange}
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="form-field">
              <input
                placeholder="SKU"
                type="text"
                name="sku"
                // value={priceData.sku}
                // onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Section -2  */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Discounts</h2>
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-700">On Sale</span>
              {/* <ToggleButton isOn={priceData.onSale} onToggle={toggleSale} /> */}
            </div>
          </div>

          <div className="price-container grid-cols-2">
            <div className="form-field">
              <input
                placeholder="Discount %"
                type="text"
                name="discount"
                // value={priceData.discount}
                // onChange={handleChange}
                // disabled={!priceData.onSale}
                // className={`w-full ${!priceData.onSale ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="form-field">
              <input
                placeholder="Sale Price"
                type="text"
                name="salePrice"
                // value={priceData.salePrice}
                // onChange={handleChange}
                // disabled={!priceData.onSale}
                // className={`w-full ${!priceData.onSale ? 'opacity-50' : ''}`}
              />
            </div>
          </div>

          {/* Section -3 */}
          <h2 className="text-lg font-semibold mb-2">Inventory & Profit</h2>
          <div className="price-container grid-cols-3">
            <div className="form-field">
              <input
                placeholder="Cost of Goods"
                type="text"
                name="costOfGoods"
                // value={priceData.costOfGoods}
                // onChange={handleChange}
                className="w-full"
              />
            </div>
            <div className="form-field">
              <input
                placeholder="Profit"
                type="text"
                name="profit"
                // value={priceData.profit}
                readOnly
                className="w-full bg-gray-50"
              />
            </div>
            <div className="form-field">
              <input
                placeholder="Margin %"
                type="text"
                name="margin"
                // value={priceData.margin}
                readOnly
                className="w-full bg-gray-50"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="block text-gray-700 font-medium mb-2">Product Quantity</label>
            <input
              placeholder="Enter available product quantity"
              type="number"
              name="quantity"
              // value={priceData.quantity}
              // onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            <p className="text-sm text-gray-500 mt-1">Number of units currently in stock</p>
          </div>
         

        </div>

        <div className="mt-2 flex justify-between">
          <button
            // onClick={handlePrev}
            type="button"
            className="product-btn-prev"
          >
            Previous
          </button>
          <button
            // onClick={handleNext}
            type="button"
            className="product-btn"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Price;