import React, { useState } from "react";
import ProductInformation from "./components/product-information";
import Media from "./components/media";
import Price from "./components/price";
import Tags from "./components/tags";
import { Incoterms } from './components/incoterms';
import AddProductTerms from './components/product-terms';
import ProgressBar from "../../buyer/components/cart/PurchaseRequestProgress";
import '../css/product.css';

export const AddProduct = () => {

  const [errorMessage, setErrorMessage] = useState('');

  // product information state
  const [productInformation, setProductInformation] = React.useState({
    name: '',
    moq: '',
    moqUnit: '',
    description: '',
    detailedDescription: '',
    category: '',
    hsnCode: ''
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
    currency: 'USD',
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



  // preferred inco terms
  type Trader = 'Buyer' | 'Seller';
  
  // Define all possible incoterms
  type IncotermType = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';
  
  // Define all possible row names
  type RowName = 
    | 'Charges/Fees'
    | 'Transfer of risk'
    | 'Commercial Invoice'
    | 'Packaging, Quality Control, Marking'
    | 'Loading & Inland Delivery'
    | 'Export Duty & Taxes'
    | 'Origin Terminal Handling'
    | 'Insurance'
    | 'Carriage Charges'
    | '*Destination Terminal Handling'
    | 'Delivery to Destination'
    | 'Unloading at Destination'
    | 'Import Duty & Taxes';

  // Define the structure for each incoterm row
  interface IncotermRowData {
    [key: string]: Trader;
  }

  // Main incoterms state interface
  interface IncotermsState {
    // The currently selected incoterm column
    selectedIncoterm: IncotermType | '';
    
    // Data for only the selected incoterm (not all incoterms)
    selectedIncotermData: IncotermRowData;
    
    // Default values for each incoterm (for reference)
    defaults: Record<IncotermType, IncotermRowData>;
  }

  // Initialize the default values for each incoterm
  const defaultIncotermValues: Record<IncotermType, IncotermRowData> = {
    EXW: {
      'Loading & Inland Delivery': 'Buyer',
      'Origin Terminal Handling': 'Buyer',
      'Insurance': 'Buyer',
      'Carriage Charges': 'Buyer',
      'Unloading at Destination': 'Buyer',
      'Export Duty & Taxes': 'Buyer',
      'Import Duty & Taxes': 'Buyer',
    },
    FCA: {
      'Loading & Inland Delivery': 'Seller',
      'Insurance': 'Buyer',
      'Carriage Charges': 'Buyer',
      'Unloading at Destination': 'Buyer',
      'Export Duty & Taxes': 'Seller',
      'Import Duty & Taxes': 'Buyer',
    },
    FAS: {
      'Insurance': 'Buyer',
      'Carriage Charges': 'Buyer',
      'Unloading at Destination': 'Buyer',
      'Export Duty & Taxes': 'Seller',
      'Import Duty & Taxes': 'Buyer',
    },
    FOB: {
      'Insurance': 'Buyer',
      'Carriage Charges': 'Buyer',
      'Unloading at Destination': 'Buyer',
      'Export Duty & Taxes': 'Seller',
      'Import Duty & Taxes': 'Buyer',
    },
    CFR: {
      'Insurance': 'Buyer',
      'Carriage Charges': 'Seller',
      'Unloading at Destination': 'Buyer',
      'Export Duty & Taxes': 'Seller',
      'Import Duty & Taxes': 'Buyer',
    },
    CIF: {
      'Insurance': 'Seller',
      'Carriage Charges': 'Seller',
      'Unloading at Destination': 'Buyer',
      'Export Duty & Taxes': 'Seller',
      'Import Duty & Taxes': 'Buyer',
    },
    CPT: {
      'Carriage Charges': 'Seller',
      '*Destination Terminal Handling': 'Buyer',
      'Unloading at Destination': 'Buyer',
      'Export Duty & Taxes': 'Seller',
      'Import Duty & Taxes': 'Buyer',
    },
    CIP: {
      'Insurance': 'Seller',
      'Carriage Charges': 'Seller',
      '*Destination Terminal Handling': 'Buyer',
      'Unloading at Destination': 'Buyer',
      'Export Duty & Taxes': 'Seller',
      'Import Duty & Taxes': 'Buyer',
    },
    DAP: {
      'Insurance': 'Buyer',
      'Carriage Charges': 'Seller',
      '*Destination Terminal Handling': 'Seller',
      'Unloading at Destination': 'Buyer',
      'Export Duty & Taxes': 'Seller',
      'Import Duty & Taxes': 'Buyer',
    },
    DPU: {
      'Insurance': 'Buyer',
      'Carriage Charges': 'Seller',
      '*Destination Terminal Handling': 'Seller',
      'Unloading at Destination': 'Seller',
      'Export Duty & Taxes': 'Seller',
      'Import Duty & Taxes': 'Buyer',
    },
    DDP: {
      'Insurance': 'Buyer',
      'Carriage Charges': 'Seller',
      '*Destination Terminal Handling': 'Seller',
      'Unloading at Destination': 'Buyer',
      'Export Duty & Taxes': 'Seller',
      'Import Duty & Taxes': 'Seller',
    },
  };

  const [incotermsState, setIncotermsState] = useState<IncotermsState>({
    selectedIncoterm: '',
    selectedIncotermData: {},
    defaults: defaultIncotermValues,
  });


  const validateStep = () => {
    switch (step) {
      // case 0: // Product Information
      //   if (!productInformation.name) {
      //     setErrorMessage("Name is required.");
      //     return false;
      //   }
      //   if (!productInformation.moq) {
      //     setErrorMessage("MOQ is required.");
      //     return false;
      //   }
      //   if (!productInformation.moqUnit) {
      //     setErrorMessage("MOQ Unit is required.");
      //     return false;
      //   }
      //    if (!productInformation.hsnCode) {
      //     setErrorMessage("HSN Code is required.");
      //     return false;
      //   }
      //   if (!productInformation.category) {
      //     setErrorMessage("Category is required.");
      //     return false;
      //   }
      //   if (!productInformation.description) {
      //     setErrorMessage("Description is required.");
      //     return false;
      //   }
      //   if(!productInformation.detailedDescription) {
      //     setErrorMessage("Detailed Description is required. ")
      //   }



      //   setErrorMessage(''); // Clear error if all fields are valid
      //   return true;

      // case 1: // Media
      //   if (productImages.length === 0) {
      //     setErrorMessage("At least one product image is required.");
      //     return false;
      //   }
      //   if (testReports.length === 0) {
      //     setErrorMessage("At least one test report is required.");
      //     return false;
      //   }
      //   setErrorMessage(''); // Clear error if all fields are valid
      //   return true;

      // case 2: // Pricing
      //   if (!priceData.price) {
      //     setErrorMessage("Price is required.");
      //     return false;
      //   }
      //   if (!priceData.sku) {
      //     setErrorMessage("SKU is required.");
      //     return false;
      //   }
      //   if (!priceData.costOfGoods) {
      //     setErrorMessage("Cost of Goods is required.");
      //     return false;
      //   }

      //   if (!priceData.margin) {
      //     setErrorMessage("Margin is required.");
      //     return false;
      //   }
      //   setErrorMessage(''); // Clear error if all fields are valid
      //   return true;

      // case 3: // Tags
      //   if (tagsData.tags.length === 0) {
      //     setErrorMessage("At least one tag is required.");
      //     return false;
      //   }
      //   setErrorMessage(''); // Clear error if all fields are valid
      //   return true;

      // todo trade terms and incoterms

      default:
        return true;
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
        return <Price priceData={priceData} setPriceData={setPriceData} />;
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
      <div className={`relative w-full ${(step < 4) ? 'my-16' : ''}`}>
        {step < 4 && <ProgressBar
          className="absolute left-1/2 -translate-y-1/2 -translate-x-1/2 top-0 z-20"
          step1="Product Info"
          step2="Media"
          step3="Pricing"
          step4="Tags"
          currentStep={step}
        />}
        <div className={`${(step < 5) ? 'w-[60%] mx-auto translate-y-6 border border-gray-300 rounded-lg px-6 pt-16 pb-6' : 'mx-8 mb-8'}`}>
          {renderStepContent()}

          {/* Render errors for each step */}
          <div className="text-md text-red-600 "> {errorMessage} </div>

          <div className="mt-8 flex justify-between">
            {!(step === 0) && <button
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              type="button"
              className="product-btn !bg-[black]"
            >
              Prev
            </button>}
            <button
              onClick={() => (validateStep()) ? setStep((prev) => Math.min(prev + 1, 5)) : ''}
              type="button"
              className="product-btn ml-auto"
            >
              {(step < 5) ? "Next" : "Publish Product"}
            </button>
          </div>
        </div>

      </div>

    </>

  );
};
