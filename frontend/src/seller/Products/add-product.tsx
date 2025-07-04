import React from "react";
import ProgressBar from "../../buyer/components/cart/PurchaseRequestProgress";




export const AddProduct = () => {

  return (

    <>
      <div className="relative w-full my-16">
        <ProgressBar
          className="absolute left-1/2 -translate-y-1/2 -translate-x-1/2 top-0 z-20"
          step1="Product Info"
          step2="Media"
          step3="Pricing"
          step4="Tags"
          currentStep={1}
        />
        <div className="your-content-class">
          {/* Your main content here */}
          {/* {renderPage()} */}
        </div>
      </div>

    </>

  );
};
