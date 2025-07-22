import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductInformation from "../components/Products/product-information";
import Media from "../components/Products/media";
import Price from "../components/Products/price";
import Tags from "../components/Products/tags";
import { Incoterms } from '../../components/incoterms';
import AddProductTerms from '../components/Products/product-terms';
import ProgressBar from "../../buyer/components/cart/PurchaseRequestProgress";
import '../css/product.css';
import { createProduct, CreateProductData } from '../../services/products.service';
import { TryBreyusCoreHeader } from "../../components/Header";


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

      'Origin Terminal Handling': 'Buyer',
      'Insurance': 'Buyer',
      'Carriage Charges': 'Buyer',
      'Unloading at Destination': 'Buyer',
    },
    FCA: {
      'Loading & Inland Delivery': 'Seller',
      'Insurance': 'Buyer',
      'Carriage Charges': 'Buyer',
      'Unloading at Destination': 'Buyer',
    },
    FAS: {
      'Insurance': 'Buyer',
      'Unloading at Destination': 'Buyer',
    },
    FOB: {
      'Insurance': 'Buyer',
      'Unloading at Destination': 'Buyer',
    },
    CFR: {
      'Insurance': 'Buyer',
      'Unloading at Destination': 'Buyer',
    },
    CIF: {
      'Insurance': 'Seller',
      'Unloading at Destination': 'Buyer',
    },
    CPT: {
      '*Destination Terminal Handling': 'Buyer',
      'Unloading at Destination': 'Buyer',
    },
    CIP: {
      'Insurance': 'Buyer',
      '*Destination Terminal Handling': 'Buyer',
      'Unloading at Destination': 'Buyer',

    },
    DAP: {
      'Insurance': 'Buyer',
      '*Destination Terminal Handling': 'Seller',
      'Unloading at Destination': 'Buyer',
    },
    DPU: {
      'Insurance': 'Buyer',
      '*Destination Terminal Handling': 'Seller',
    },
    DDP: {
      'Insurance': 'Buyer',
      '*Destination Terminal Handling': 'Seller',
      'Unloading at Destination': 'Buyer',
    },
  };

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
        if(!incotermsState.selectedIncoterm) {
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
              disabled={isSubmitting}
            >
              Prev
            </button>}
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
              className="product-btn ml-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : (step < 5) ? "Next" : "Publish Product"}
            </button>
          </div>
        </div>

      </div>

    </>

  );
};
