import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductInformation from "../components/product-information";
import Media from "../components/media";
import Price from "../components/price";
import Tags from "../components/tags";
import { Incoterms } from '../../components/incoterms';
import AddProductTerms from '../components/product-terms';
import AddProductProgress from "../../components/AddProductProgress";
import '../css/product.css';
import { createProduct, CreateProductData } from '../../services/products.service';
import { TryBreyusCoreHeader } from "../../components/Header";
import { IncotermsState, defaultIncotermValues } from "../../types/Incoterms"


export const AddProduct = () => {

  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // product information state
  const [productInformation, setProductInformation] = React.useState({
    name: '',
    stock: '',
    stockUnit: '',
    moq: '',
    moqUnit: '',
    description: '',
    detailedDescription: '',
    category: '',
    hsnCode: '',
    application: '',
    environmentalImpact: '',
    qualityAssurance: ''
  });

  // media state
  const [productImages, setProductImages] = useState<File[]>([]);
  const [testReports, setTestReports] = useState<File[]>([]);

  const handleProductImagesChange = (newImages: File[]) => {
    setProductImages(newImages);
  };

  const handleTestReportsChange = (newReports: File[]) => {
    setTestReports(newReports);
  };

  // pricing state
  const [priceData, setPriceData] = React.useState({
    price: '',
    currency: 'INR',
    sku: '',
    onSale: false,
    discount: '',
    salePrice: '',
    costOfGoods: '',
    profit: '',
    pricing: '',
    margin: ''
  });

  // tags state
  const [tagsData, setTagsData] = React.useState({
    tags: [] as string[],
    input: ''
  });

  // preferred trade terms
  const [tradeTerms, setTradeTerms] = React.useState({
    revenueMin: '',
    revenueMax: '',
    currency: 'INR',
    unit: 'Crore',
    yearsTrade: '',
    industry: '',
    marketYears: '',
    sellerMarketYears: '',
    marketcapture: '',

  });







  const [incotermsState, setIncotermsState] = useState<IncotermsState>({
    selectedIncoterm: '',
    selectedIncotermData: {},
    defaults: defaultIncotermValues,
  });


  const validateStep = () => {
    switch (step) {
      case 0: // Product Information
        if (!productInformation.name) {
          setErrorMessage("Name is required.");
          return false;
        }
        if (!productInformation.stock) {
          setErrorMessage("Stock is required.");
          return false;
        }
        if (!productInformation.stockUnit) {
          setErrorMessage("Stock Unit is required.");
          return false;
        }
        if (!productInformation.moq) {
          setErrorMessage("MOQ is required.");
          return false;
        }
        if (!productInformation.moqUnit) {
          setErrorMessage("MOQ Unit is required.");
          return false;
        }
        if (!productInformation.hsnCode) {
          setErrorMessage("HSN Code is required.");
          return false;
        }
        if (!productInformation.category) {
          setErrorMessage("Category is required.");
          return false;
        }
        if (!productInformation.description) {
          setErrorMessage("Description is required.");
          return false;
        }
        if (!productInformation.detailedDescription) {
          setErrorMessage("Detailed Description is required. ")
          return false;
        }
        setErrorMessage(''); // Clear error if all fields are valid
        return true;

      case 1: // Media
        if (productImages.length === 0) {
          setErrorMessage("At least one product image is required.");
          return false;
        }
        if (testReports.length === 0) {
          setErrorMessage("At least one test report is required.");
          return false;
        }
        setErrorMessage(''); // Clear error if all fields are valid
        return true;

      case 2: // Pricing
        if (!priceData.price) {
          setErrorMessage("Price is required.");
          return false;
        }
        if (!priceData.sku) {
          setErrorMessage("SKU is required.");
          return false;
        }
        if (!priceData.costOfGoods) {
          setErrorMessage("Cost of Goods is required.");
          return false;
        }
        if (!priceData.margin) {
          setErrorMessage("Margin is required.");
          return false;
        }
        setErrorMessage(''); // Clear error if all fields are valid
        return true;

      case 3: // Tags
        if (tagsData.tags.length === 0) {
          setErrorMessage("At least one tag is required.");
          return false;
        }
        setErrorMessage(''); // Clear error if all fields are valid
        return true;

      case 4: // preferred trade terms 
        if (!(tradeTerms.revenueMin && tradeTerms.revenueMax && tradeTerms.currency && tradeTerms.unit)) {
          setErrorMessage("All the revenue fields are required.")
          return false;
        }
        if (!tradeTerms.yearsTrade) {
          setErrorMessage("How many potential years you want to trade with buyer? is required.")
          return false;
        }
        if (!tradeTerms.yearsTrade) {
          setErrorMessage("How many potential years you want to trade with buyer? is required.")
          return false;
        }
        if (!tradeTerms.marketYears) {
          setErrorMessage("How long have you been in the market? is required");
          return false;
        }
        if (!tradeTerms.sellerMarketYears) {
          setErrorMessage("How long you want to have your buyer to be in the market? is required");
          return false;
        }
        setErrorMessage('');
        return true

      case 5: // preferred Incoterms
        if (!incotermsState.selectedIncoterm) {
          setErrorMessage("Select Your preferred incoterm.")
          return false;
        }
        setErrorMessage('');
        return true;

      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Prepare product data
      const productData: CreateProductData = {
        // Product information
        name: productInformation.name,
        stock: productInformation.stock,
        stockUnit: productInformation.stockUnit,
        moq: productInformation.moq,
        moqUnit: productInformation.moqUnit,
        description: productInformation.description,
        detailedDescription: productInformation.detailedDescription,
        category: productInformation.category,
        hsnCode: productInformation.hsnCode,

        // Pricing
        price: priceData.price,
        currency: priceData.currency,
        sku: priceData.sku,
        onSale: priceData.onSale,
        discount: priceData.discount,
        salePrice: priceData.salePrice,
        costOfGoods: priceData.costOfGoods,
        profit: priceData.profit,
        margin: priceData.margin,

        // Tags
        tags: tagsData.tags,

        // Trade terms
        revenueMin: tradeTerms.revenueMin,
        revenueMax: tradeTerms.revenueMax,
        currencyTrade: tradeTerms.currency,
        unitTrade: tradeTerms.unit,
        yearsTrade: tradeTerms.yearsTrade,
        industry: tradeTerms.industry,
        marketYears: tradeTerms.marketYears,
        sellerMarketYears: tradeTerms.sellerMarketYears,
        marketcapture: tradeTerms.marketcapture,

        // Incoterms
        selectedIncoterm: incotermsState.selectedIncoterm,
        selectedIncotermData: incotermsState.selectedIncotermData,
      };

      // Combine all files
      const allFiles = [...productImages, ...testReports];

      // Submit to backend servce
      const response = await createProduct(productData, allFiles);

      if (response.statusCode === 201) {
        navigate('/seller/inventory');
      } else {
        setErrorMessage(response.message || 'Failed to create product');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [step, setStep] = React.useState(0);

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return <ProductInformation productInformation={productInformation} setProductInformation={setProductInformation} />;
      case 1:
        return <Media productImages={productImages} onProductImagesChange={handleProductImagesChange} testReports={testReports} onTestReportsChange={handleTestReportsChange} />;
      case 2:
        return <Price priceData={priceData} setPriceData={setPriceData} moq={productInformation.moq + ' ' + productInformation.moqUnit} />;
      case 3:
        return <Tags tagsData={tagsData} setTagsData={setTagsData} />;
      case 4:
        return <AddProductTerms tradeTerms={tradeTerms} setTradeTerms={setTradeTerms} />
      case 5:
        return <Incoterms incoterms={incotermsState} setIncoterms={setIncotermsState} />
      default:
        return null;
    }
  }

  return (
    <>
      <TryBreyusCoreHeader />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header - Show for first 4 steps */}
          {step < 4 && (
            <div className="mb-6">
              <AddProductProgress currentStep={step} totalSteps={6} />
            </div>
          )}

          {/* Form Container */}
          <div className={`${step < 4 ? 'bg-white rounded-xl border border-gray-200 shadow-sm p-8' : step === 4 ? 'bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-4xl mx-auto' : ''}`}>
            {renderStepContent()}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errorMessage}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center">
              {step > 0 ? (
                <button
                  onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
                  type="button"
                  className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Prev
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => {
                  if (step < 5) {
                    if (validateStep()) {
                      setStep((prev) => Math.min(prev + 1, 5));
                    }
                  } else {
                    handleSubmit();
                  }
                }}
                type="button"
                className="px-6 py-2.5 bg-[#C4A962] text-white rounded-lg font-medium hover:bg-[#B39952] transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : step === 4 ? 'Proceed to INCO-TERMS' : step < 5 ? 'Next' : 'Publish Product'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
