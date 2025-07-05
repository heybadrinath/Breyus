import React from "react";
import ProductInformation from "./components/product-information";
import Media from "./components/media";
import Price from "./components/price";
import Tags from "./components/tags";
import ProgressBar from "../../buyer/components/cart/PurchaseRequestProgress";
import '../css/product.css';




export const AddProduct = () => {

  const [step, setStep] = React.useState(0);


  const renderStepContent = () => {

    switch (step) {
      case 0:
        return <ProductInformation />;
      case 1:
        return <Media />;
      case 2:
        return <Price />;
      case 3:
        return <Tags />;
      default:
        return null;
    }
  }

  return (

    <>
      <div className="relative w-full my-16">
        <ProgressBar
          className="absolute left-1/2 -translate-y-1/2 -translate-x-1/2 top-0 z-20"
          step1="Product Info"
          step2="Media"
          step3="Pricing"
          step4="Tags"
          currentStep={step}
        />
        <div className="w-[60%] mx-auto translate-y-6 border border-gray-300 rounded-lg px-6 pt-16 pb-6">
          {renderStepContent()}
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              type="button"
              className="product-btn-prev !bg-[black]"
            >
              Previous
            </button>
            <button
              onClick={() => setStep((prev) => Math.min(prev + 1, 3))}
              type="button"
              className="product-btn"
            >
              Next
            </button>
          </div>
        </div>

      </div>

    </>

  );
};
