import React from "react";

const Tags = () => {
 
  
  return (
    <div>
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">Tags</h1>

        <div className="product-card">
          <div className="flex justify-between items-center mb-4">
            {/* <h2 className="text-lg font-semibold">Product Tags <span className="text-sm text-gray-500">({tags.length}/5)</span></h2> */}
            <button
            //   onClick={fetchSuggestedTags}
            //   disabled={isLoading || !productData?.name}
            //   className={`flex items-center text-sm px-3 py-1.5 rounded-md ${isLoading || !productData?.name
                // ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                // : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                // }`}
            >
              {/* {isLoading ? (
                <span className="flex items-center">
                  <RefreshCw className="mr-1 animate-spin" size={14} />
                  Generating...
                </span>
              ) : (
                <>
                  <RefreshCw className="mr-1" size={14} />
                  <span>Auto-Generate Tags</span>
                </>
              )} */}
            </button>
          </div>

          {/* {error && ( */}
            <div className="text-sm mb-4 p-3 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
              {/* {error} */}
            </div>
          {/* )} */}

          {/* {successMessage && ( */}
            <div className="text-sm mb-4 p-3 rounded bg-green-50 text-green-700 border border-green-200">
              {/* {successMessage} */}
            </div>
          {/* )} */}

          <div className="border border-gray-200 rounded-xl p-4 mb-4">
            <input
              type="text"
            //   placeholder={tags.length >= 5 ? "Maximum 5 tags reached" : "Add your tag (press Enter or comma)"}
              className="outline-none px-3 py-2 mb-4 bg-transparent border-b border-gray-200 w-full focus:border-gray-400 transition-all"
            //   value={input}
            //   onChange={(e) => setInput(e.target.value)}
            //   onKeyDown={handleKeyDown}
            //   disabled={tags.length >= 5}
            />

            <div className="flex flex-wrap gap-2 mt-2">
              {/* {tags.map((tag, idx) => (
                <div
                  key={`${tag}-${idx}`}
                  className="flex items-center bg-gradient-to-r from-black to-[#353535] text-white rounded-full px-3 py-1.5 transition-all hover:shadow-md"
                >
                  <span className="mr-1 text-sm">{tag}</span>
                  <button
                    className="ml-1 text-white hover:text-gray-200 focus:outline-none text-sm transition-colors"
                    onClick={() => removeTag(idx)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </div>
              ))} */}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Tags help buyers find your products. Choose descriptive words related to your product.</p>
            <ul className="list-disc ml-5 mt-2">
              <li>Use specific keywords relevant to your product</li>
              <li>Include material, usage, and key features</li>
              <li>Avoid generic terms or irrelevant words</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            // onClick={handlePrev}
            className="product-btn-prev"
          >
            Previous
          </button>
          <button
            // onClick={handleSubmit}
            // disabled={isSubmitting}
            // className={`product-btn ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {/* {isSubmitting ? 'Processing...' : isEditMode ? 'Update Product' : 'Add Product'} */}
          </button>
        </div>
      </div>
   </div>
  );
};

export default Tags;