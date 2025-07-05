import React from "react";

// Product Information Component
 const ProductInformation = () => {


  return (
    <div>
      <div className="flex flex-col h-full">
        {/* <h1 className="section-title font-bold mb-6 text-2xl">{isEditMode ? 'Edit Product' : 'Product Information'}</h1> */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="form-field">
            <input
              placeholder="Product Name"
              className="w-full"
              type="text"
              name="name"
            //   value={formData.name}
            //   onChange={handleChange}
            />
          </div>
          <div className="form-field">
            <select
              className="w-full bg-transparent"
              name="moq"
            //   value={formData.moq}
            //   onChange={handleChange}
            >
              <option value="" disabled>Minimum Order Quantity (MOQ)</option>
              <option value="100 KG">100 KG</option>
              <option value="200 KG">200 KG</option>
              <option value="500 KG">500 KG</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="product-card">
            <h2 className="text-lg font-semibold mb-3">Description</h2>
            <div className="mb-4">
              <input
                placeholder="Product summary (short description)"
                className="w-full border border-gray-200 rounded-t-lg px-3 py-2"
                type="text"
                name="description"
                // value={formData.description}
                // onChange={handleChange}
              />
            </div>
            <textarea
              placeholder="Detailed Description - Include product specifications, features, and benefits"
              className="w-full h-[180px] border border-gray-200 rounded-b-lg px-3 py-2"
              name="detailedDescription"
              // value={formData.detailedDescription}
            //   onChange={handleChange}
            />
          </div>

          <div className="product-card flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Product Details</h2>
            <div className="form-field mb-6">
              <select
                className="w-full"
                name="category"
                // value={formData.category}
                // onChange={handleChange}
              >
                <option value="">Select Category</option>
                <option value="Oils">Oils</option>
                <option value="dummy-1">dummy-1</option>
                <option value="dummy-2">dummy-2</option>
              </select>
            </div>

            <div className="form-field">
              <input
                className="w-full"
                placeholder="HSN Code"
                type="text"
                name="hsnCode"
                // value={formData.hsnCode}
                // onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">Harmonized System Nomenclature code for product classification</p>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default ProductInformation;