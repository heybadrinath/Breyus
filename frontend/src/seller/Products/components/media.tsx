import React from "react";

// Media Component
const Media= () => {

 
  return (
  <div>
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">Media</h1>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 product-card">
            <h2 className="text-lg font-semibold mb-3">Product Images</h2>
            <p className="text-gray-500 text-sm mb-4">Upload product photos (max 5 images)</p>
            {/* <ImageUpload onChange={handleProductImagesChange} value={productImages} /> */}
          </div>
          <div className="flex-1 product-card">
            <h2 className="text-lg font-semibold mb-3">Test Reports</h2>
            <p className="text-gray-500 text-sm mb-4">Upload test certificates (PDF, JPG)</p>
            {/* <ImageUpload onChange={handleTestReportsChange} value={testReports} /> */}
          </div>
        </div>
        <div className="mt-8 flex justify-between">
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

export default Media;