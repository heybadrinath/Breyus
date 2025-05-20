import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import "../seller/css/product.css";
import productService from "../services/product.service";
import authService from "../services/auth.service";



const ProductProgressVector = ({ page }: { page: string }) => { // use 'product, media, price, tags' for different pages in page prop
    let product = false;
    let media = false;
    let price = false;
    let tags = false;
    if (page === "product") {
        product = true;
    } else if (page === "media") {
        product = true;
        media = true;
    } else if (page === "price") {
        product = true;
        media = true;
        price = true;
    } else if (page === "tags") {
        product = true;
        media = true;
        price = true;
        tags = true;
    }
    return (
        <div className={"m-auto w-fit"}>
            <svg className={"transition-all delay-1000 ease-in-out"} width="762" height="86" viewBox="0 0 762 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="product-progress">
                    <path id="Vector" d="M753.76 2H10.2398C5.68908 2 2 5.80558 2 10.5V75.5C2 80.1944 5.68908 84 10.2398 84H753.76C758.311 84 762 80.1944 762 75.5V10.5C762 5.80558 758.311 2 753.76 2Z" fill="url(#paint0_linear_1_41)" stroke="#353535" stroke-width="3" />
                    <path id="media-dot" fill-opacity={media ? "1" : "0.38"} d="M280.699 53.5C285.517 53.5 289.423 49.4706 289.423 44.5C289.423 39.5294 285.517 35.5 280.699 35.5C275.881 35.5 271.974 39.5294 271.974 44.5C271.974 49.4706 275.881 53.5 280.699 53.5Z" fill="#FFFDFD" />
                    <path id="product-dot" fill-opacity={product ? "1" : "0.38"} d="M92.6378 53.5C97.4562 53.5 101.362 49.4706 101.362 44.5C101.362 39.5294 97.4562 35.5 92.6378 35.5C87.8194 35.5 83.9133 39.5294 83.9133 44.5C83.9133 49.4706 87.8194 53.5 92.6378 53.5Z" fill="white" />
                    <path id="price-dot" fill-opacity={price ? "1" : "0.38"} d="M467.791 53.5C472.609 53.5 476.515 49.4706 476.515 44.5C476.515 39.5294 472.609 35.5 467.791 35.5C462.972 35.5 459.066 39.5294 459.066 44.5C459.066 49.4706 462.972 53.5 467.791 53.5Z" fill="white" />
                    <path id="tags-dot" fill-opacity={tags ? "1" : "0.38"} d="M654.883 53.5C659.701 53.5 663.607 49.4706 663.607 44.5C663.607 39.5294 659.701 35.5 654.883 35.5C650.064 35.5 646.158 39.5294 646.158 44.5C646.158 49.4706 650.064 53.5 654.883 53.5Z" fill="white" />
                    <path id="product-info-text" fill-opacity={product ? "1" : "0"} d="M72.8855 24.644C72.8855 24.9427 72.8157 25.2227 72.6761 25.484C72.5414 25.7453 72.3272 25.956 72.0325 26.116C71.7426 26.276 71.3762 26.356 70.9312 26.356H70.0239V28.5H68.9382V22.916H70.9312C71.35 22.916 71.7067 22.9907 72.0014 23.14C72.2961 23.2893 72.5162 23.4947 72.6606 23.756C72.8109 24.0173 72.8855 24.3133 72.8855 24.644ZM70.8847 25.452C71.1842 25.452 71.4072 25.3827 71.5516 25.244C71.6961 25.1 71.7688 24.9 71.7688 24.644C71.7688 24.1 71.4741 23.828 70.8847 23.828H70.0239V25.452H70.8847ZM74.7419 24.756C74.8815 24.5213 75.0628 24.3373 75.2848 24.204C75.5126 24.0707 75.7714 24.004 76.0603 24.004V25.18H75.7733C75.4321 25.18 75.1742 25.2627 74.9978 25.428C74.8272 25.5933 74.7419 25.8813 74.7419 26.292V28.5H73.6562V24.068H74.7419V24.756ZM78.6999 28.572C78.286 28.572 77.9137 28.4787 77.5832 28.292C77.2516 28.1 76.9909 27.8307 76.7999 27.484C76.6138 27.1373 76.5207 26.7373 76.5207 26.284C76.5207 25.8307 76.6157 25.4307 76.8077 25.084C77.0035 24.7373 77.2701 24.4707 77.6064 24.284C77.9418 24.092 78.317 23.996 78.7309 23.996C79.1439 23.996 79.519 24.092 79.8554 24.284C80.1908 24.4707 80.4545 24.7373 80.6464 25.084C80.8423 25.4307 80.9411 25.8307 80.9411 26.284C80.9411 26.7373 80.8403 27.1373 80.6387 27.484C80.4419 27.8307 80.1734 28.1 79.8321 28.292C79.4958 28.4787 79.1187 28.572 78.6999 28.572ZM78.6999 27.596C78.8957 27.596 79.0799 27.548 79.2505 27.452C79.426 27.3507 79.5656 27.2013 79.6693 27.004C79.772 26.8067 79.8244 26.5667 79.8244 26.284C79.8244 25.8627 79.7158 25.54 79.4987 25.316C79.2864 25.0867 79.0256 24.972 78.7154 24.972C78.4052 24.972 78.1435 25.0867 77.9322 25.316C77.7247 25.54 77.6219 25.8627 77.6219 26.284C77.6219 26.7053 77.7228 27.0307 77.9244 27.26C78.1309 27.484 78.3897 27.596 78.6999 27.596Z" fill="white" />
                    <path id="pricing-text" fill-opacity={price ? "1" : "0"} d="M458.702 24.644C458.702 24.9427 458.632 25.2227 458.492 25.484C458.358 25.7453 458.144 25.956 457.849 26.116C457.559 26.276 457.192 26.356 456.748 26.356H455.84V28.5H454.755V22.916H456.748C457.166 22.916 457.523 22.9907 457.818 23.14C458.112 23.2893 458.333 23.4947 458.477 23.756C458.627 24.0173 458.702 24.3133 458.702 24.644ZM456.701 25.452C457.001 25.452 457.224 25.3827 457.368 25.244C457.512 25.1 457.585 24.9 457.585 24.644C457.585 24.1 457.29 23.828 456.701 23.828H455.84V25.452H456.701ZM460.558 24.756C460.698 24.5213 460.879 24.3373 461.101 24.204C461.329 24.0707 461.588 24.004 461.877 24.004V25.18H461.59C461.248 25.18 460.991 25.2627 460.814 25.428C460.644 25.5933 460.558 25.8813 460.558 26.292V28.5H459.473V24.068H460.558V24.756ZM463.159 23.54C462.967 23.54 462.807 23.4787 462.678 23.356C462.554 23.228 462.492 23.0707 462.492 22.884C462.492 22.6973 462.554 22.5427 462.678 22.42C462.807 22.292 462.967 22.228 463.159 22.228C463.35 22.228 463.508 22.292 463.632 22.42C463.761 22.5427 463.826 22.6973 463.826 22.884C463.826 23.0707 463.761 23.228 463.632 23.356C463.508 23.4787 463.35 23.54 463.159 23.54ZM463.694 24.068V28.5H462.608V24.068H463.694ZM464.487 26.284C464.487 25.8253 464.577 25.4253 464.759 25.084C464.94 24.7373 465.19 24.4707 465.511 24.284C465.832 24.092 466.198 23.996 466.612 23.996C467.144 23.996 467.584 24.1347 467.93 24.412C468.282 24.684 468.517 25.068 468.636 25.564H467.465C467.403 25.372 467.297 25.2227 467.147 25.116C467.003 25.004 466.821 24.948 466.604 24.948C466.294 24.948 466.049 25.0653 465.868 25.3C465.686 25.5293 465.596 25.8573 465.596 26.284C465.596 26.7053 465.686 27.0333 465.868 27.268C466.049 27.4973 466.294 27.612 466.604 27.612C467.043 27.612 467.33 27.4093 467.465 27.004H468.636C468.517 27.484 468.282 27.8653 467.93 28.148C467.579 28.4307 467.139 28.572 466.612 28.572C466.198 28.572 465.832 28.4787 465.511 28.292C465.19 28.1 464.94 27.8333 464.759 27.492C464.577 27.1453 464.487 26.7427 464.487 26.284ZM469.983 23.54C469.791 23.54 469.631 23.4787 469.502 23.356C469.378 23.228 469.316 23.0707 469.316 22.884C469.316 22.6973 469.378 22.5427 469.502 22.42C469.631 22.292 469.791 22.228 469.983 22.228C470.174 22.228 470.332 22.292 470.456 22.42C470.585 22.5427 470.65 22.6973 470.65 22.884C470.65 23.0707 470.585 23.228 470.456 23.356C470.332 23.4787 470.174 23.54 469.983 23.54ZM470.518 24.068V28.5H469.432V24.068H470.518ZM473.971 24.004C474.483 24.004 474.896 24.172 475.212 24.508C475.528 24.8387 475.685 25.3027 475.685 25.9V28.5H474.599V26.052C474.599 25.7 474.514 25.4307 474.343 25.244C474.172 25.052 473.94 24.956 473.645 24.956C473.345 24.956 473.108 25.052 472.931 25.244C472.761 25.4307 472.676 25.7 472.676 26.052V28.5H471.59V24.068H472.676V24.62C472.821 24.428 473.004 24.2787 473.226 24.172C473.454 24.06 473.702 24.004 473.971 24.004ZM478.4 23.996C478.721 23.996 479.003 24.0627 479.245 24.196C479.488 24.324 479.679 24.492 479.819 24.7V24.068H480.912V28.532C480.912 28.9427 480.833 29.308 480.672 29.628C480.512 29.9533 480.272 30.2093 479.951 30.396C479.631 30.588 479.243 30.684 478.788 30.684C478.178 30.684 477.677 30.5373 477.283 30.244C476.895 29.9507 476.676 29.5507 476.624 29.044H477.702C477.759 29.2467 477.88 29.4067 478.066 29.524C478.258 29.6467 478.488 29.708 478.757 29.708C479.073 29.708 479.328 29.6093 479.524 29.412C479.721 29.22 479.819 28.9267 479.819 28.532V27.844C479.679 28.052 479.486 28.2253 479.237 28.364C478.995 28.5027 478.716 28.572 478.4 28.572C478.038 28.572 477.708 28.476 477.407 28.284C477.108 28.092 476.87 27.8227 476.694 27.476C476.523 27.124 476.438 26.7213 476.438 26.268C476.438 25.82 476.523 25.4227 476.694 25.076C476.87 24.7293 477.105 24.4627 477.399 24.276C477.7 24.0893 478.033 23.996 478.4 23.996ZM479.819 26.284C479.819 26.012 479.768 25.78 479.664 25.588C479.561 25.3907 479.422 25.2413 479.245 25.14C479.07 25.0333 478.881 24.98 478.679 24.98C478.477 24.98 478.291 25.0307 478.121 25.132C477.95 25.2333 477.81 25.3827 477.702 25.58C477.599 25.772 477.547 26.0013 477.547 26.268C477.547 26.5347 477.599 26.7693 477.702 26.972C477.81 27.1693 477.95 27.3213 478.121 27.428C478.297 27.5347 478.483 27.588 478.679 27.588C478.881 27.588 479.07 27.5373 479.245 27.436C479.422 27.3293 479.561 27.18 479.664 26.988C479.768 26.7907 479.819 26.556 479.819 26.284Z" fill="white" />
                    <line className="transition-all ease-in-out delay-1000" x1="90" y1="44.5" y2="44.5" x2={(page === "product") ? 90 : (page === "media") ? 281 : (page === "price") ? 461 : (page === "tags") ? 655 : 90} stroke="white" strokeWidth="2" />

                </g>
                <defs>
                    <linearGradient id="paint0_linear_1_41" x1="0.545918" y1="43" x2="763.454" y2="43" gradientUnits="userSpaceOnUse">
                        <stop offset="0.9999" />
                        <stop offset="1" stop-color="#353535" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}; // page attributes 'product', 'media', 'price', 'tags'



const ProductLayout = ({ productype, Body }: { productype: string, Body: ReactNode }) => {
    return (
        <div className={"w-[840px] h-fit mx-auto my-14 flex flex-col"}>
            <ProductProgressVector page={productype} />
            <div className={"w-[850px] h-[fit] px-4 absolute py-8 translate-y-16 border-[#00000021] shadow-lg rounded-lg border-[2px]"}>
                {Body}

            </div>
        </div>
    );
}

// Interface to define product data structure
interface ProductData {
  id?: string;
  name: string;
  category?: string;
  description?: string;
  moq?: string;
  detailedDescription?: string;
  hsnCode?: string;
  productImage?: string;
  testReports?: string;
  price?: number;
  currency?: string;
  sku?: string;
  onSale?: boolean;
  discount?: number;
  salePrice?: number;
  costOfGoods?: number;
  profit?: number;
  margin?: number;
  quantity?: number;
  tags?: string[];
}

// Define a product interface for fetched products
interface Product {
  id: string;
  name: string;
  category?: string;
  price?: number;
  sku?: string;
  sellerId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Add other fields as needed
}

interface PriceData {
  price: string;
  currency: string;
  sku: string;
  onSale: boolean;
  discount: string;
  salePrice: string;
  costOfGoods: string;
  profit: string;
  margin: string;
  quantity: string;
}

interface ProductProps {
  setPageNo: (pageNo: number) => void;
  updateProductData?: (data: Partial<ProductData>) => void;
  productData?: Partial<ProductData>;
}

interface ToggleButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  isOn: boolean;
  onToggle: () => void;
  className?: string;
}

interface ImageUploadProps {
  onChange?: (files: File[]) => void;
  value?: File[];
}

// ToggleButton Component
const ToggleButton: React.FC<ToggleButtonProps> = ({ 
  isOn, 
  onToggle, 
  className = '', 
  ...props 
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={isOn}
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
      isOn ? 'bg-blue-600' : 'bg-gray-200'
    } ${className}`}
    {...props}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        isOn ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// Image Upload Component
const ImageUpload: React.FC<ImageUploadProps> = ({ onChange, value = [] }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>(value);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const fileArr = Array.from(fileList).filter(file => file.type.startsWith("image/"));
    setFiles(fileArr);
    onChange?.(fileArr);
  }, [onChange]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(URL.createObjectURL(file)));
    };
  }, [files]);

  return (
    <div className="flex flex-col w-full p-2">
      <label
        htmlFor="image-upload-input"
        className={`border-2 border-gray-200 rounded-xl w-full h-[220px] p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          dragActive ? "border-blue-400 bg-blue-50" : ""
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={(e) => {
          handleDrag(e);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          id="image-upload-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {files.length === 0 ? (
          <span className="text-gray-400 text-lg text-center">
            Drop image files here and upload<br />or <span className="underline text-blue-500">browse</span>
          </span>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {files.map((file, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-20 h-20 object-cover rounded border"
              />
            ))}
          </div>
        )}
      </label>
    </div>
  );
};

// Product Information Component
const ProductInformation: React.FC<ProductProps> = ({ setPageNo, updateProductData, productData = {} }) => {
  const [formData, setFormData] = useState<Omit<ProductData, 'category'> & { category: string }>({
    name: productData.name || "",
    moq: productData.moq || "",
    description: productData.description || "",
    detailedDescription: productData.detailedDescription || "",
    category: productData.category || "",
    hsnCode: productData.hsnCode || ""
  });

  // Determine if we're in edit mode based on whether product has an ID
  const isEditMode = Boolean(productData?.id);

  // Update local state when productData changes (e.g., navigating back)
  // Only run on initial mount or when productData.name changes (to avoid circular updates)
  useEffect(() => {
    setFormData({
      name: productData.name || "",
      moq: productData.moq || "",
      description: productData.description || "",
      detailedDescription: productData.detailedDescription || "",
      category: productData.category || "",
      hsnCode: productData.hsnCode || ""
    });
  }, []);  // Removed productData dependency to avoid glitching

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    
    // Update parent data immediately, but debounced to prevent too many updates
    updateProductData?.(updatedData);
  };

  return (
    <ProductLayout productype="product" Body={
      <div className="flex flex-col h-full px-4 py-2">
        <h1 className="font-bold m-4 text-2xl">{isEditMode ? 'Edit Product' : 'Product Information'}</h1>
        <div className="flex w-full">
          <input 
            placeholder="Name" 
            className="border-b-2 m-4 p-2 focus:outline-none w-full" 
            type="text" 
            name="name" 
            value={formData.name}
            onChange={handleChange}
          />
          <select 
            className="w-full bg-transparent p-3 m-4 outline-none border-b-2 text-gray-800 placeholder-gray-400"
            name="moq"
            value={formData.moq}
            onChange={handleChange}
          >
            <option value="" disabled>MOQ</option>
            <option value="100 KG">100 KG</option>
            <option value="200 KG">200 KG</option>
            <option value="500 KG">500 KG</option>
          </select>
        </div>
        <div className="flex">
          <div className="flex flex-col mx-4">
            <h1 className="font-semibold text-md m-4">Description</h1>
            <input 
              placeholder="Precise description" 
              className="px-2 py-4 border-x border-t focus:outline-none border-[#00000053] rounded-tl-lg rounded-tr-lg" 
              type="text" 
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
            <textarea 
              placeholder="Detailed Description" 
              className="px-2 py-2 w-[25vw] h-[20vh] focus:outline-none border-[#00000053] border-x border-y rounded-bl-lg rounded-br-lg" 
              name="detailedDescription"
              value={formData.detailedDescription}
              onChange={handleChange}
            />
          </div>
          <div className="mx-4 flex w-full flex-col">
            <h1 className="font-semibold text-md m-4">Category</h1>
            <select 
              className="bg-transparent p-3 border-b-2 my-4 mx-2 w-[90%]" 
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select Category</option>
              <option value="Oils">Oils</option>
              <option value="dummy-1">dummy-1</option>
              <option value="dummy-2">dummy-2</option>
            </select>
            <h1 className="font-semibold text-md m-4">HSN Code:</h1>
            <input 
              className="focus:outline-none border-b-2 p-2 mx-2 w-[90%]" 
              placeholder="xxxxxxx" 
              type="text" 
              name="hsnCode"
              value={formData.hsnCode}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="ml-auto mt-auto flex w-fit">
          <button 
            onClick={() => setPageNo(1)} 
            className="bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md"
          >
            Next
          </button>
        </div>
      </div>
    } />
  );
};

// Media Component
const Media: React.FC<ProductProps> = ({ setPageNo, updateProductData, productData = {} }) => {
  const [productImages, setProductImages] = useState<File[]>([]);
  const [testReports, setTestReports] = useState<File[]>([]);

  // When files are selected, update the main product data state
  const handleProductImagesChange = (files: File[]) => {
    setProductImages(files);
    // For now, just store the first file name in product data
    // In a real app, you'd handle file uploads differently
    if (files.length > 0) {
      updateProductData?.({ productImage: files[0].name });
    } else {
      updateProductData?.({ productImage: undefined });
    }
  };

  const handleTestReportsChange = (files: File[]) => {
    setTestReports(files);
    if (files.length > 0) {
      updateProductData?.({ testReports: files[0].name });
    } else {
      updateProductData?.({ testReports: undefined });
    }
  };

  return (
    <ProductLayout productype="media" Body={
      <div className="flex flex-col px-4 py-2 h-full">
        <h1 className="font-bold m-4 text-2xl">Media</h1>
        <div className="flex justify-between w-full">
          <div className="w-[48%]">
            <p className="font-medium mb-2">Product Image</p>
            <ImageUpload onChange={handleProductImagesChange} value={productImages} />
          </div>
          <div className="w-[48%]">
            <p className="font-medium mb-2">Test Report Files</p>
            <ImageUpload onChange={handleTestReportsChange} value={testReports} />
          </div>
        </div>
        <div className="h-fit full flex mt-auto">
          <button 
            onClick={() => setPageNo(0)} 
            className="bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md w-fit"
          >
            Prev
          </button>
          <button 
            onClick={() => setPageNo(2)} 
            className="bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md ml-auto w-fit"
          >
            Next
          </button>
        </div>
      </div>
    } />
  );
};

// Price Component
const Price: React.FC<ProductProps> = ({ setPageNo, updateProductData, productData = {} }) => {
  const [priceData, setPriceData] = useState<PriceData>({
    price: productData.price ? String(productData.price) : "",
    currency: productData.currency || "USD",
    sku: productData.sku || "",
    onSale: productData.onSale || false,
    discount: productData.discount ? String(productData.discount) : "",
    salePrice: productData.salePrice ? String(productData.salePrice) : "",
    costOfGoods: productData.costOfGoods ? String(productData.costOfGoods) : "",
    profit: productData.profit ? String(productData.profit) : "",
    margin: productData.margin ? String(productData.margin) : "",
    quantity: productData.quantity ? String(productData.quantity) : "0"
  });

  // Update local state when productData changes - only on initial mount
  useEffect(() => {
    setPriceData({
      price: productData.price ? String(productData.price) : "",
      currency: productData.currency || "USD",
      sku: productData.sku || "",
      onSale: productData.onSale || false,
      discount: productData.discount ? String(productData.discount) : "",
      salePrice: productData.salePrice ? String(productData.salePrice) : "",
      costOfGoods: productData.costOfGoods ? String(productData.costOfGoods) : "",
      profit: productData.profit ? String(productData.profit) : "",
      margin: productData.margin ? String(productData.margin) : "",
      quantity: productData.quantity ? String(productData.quantity) : "0"
    });
  }, []); // Removed productData dependency

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...priceData, [name]: value };
    setPriceData(updatedData);
    
    // Update parent data immediately after local state changes
    // Convert string values to numbers for numeric fields
    const parentUpdate = {
      [name]: ['price', 'discount', 'salePrice', 'costOfGoods', 'quantity'].includes(name) 
        ? parseFloat(value) || 0
        : value
    };
    updateProductData?.(parentUpdate);
  };

  const toggleSale = () => {
    const updatedOnSale = !priceData.onSale;
    setPriceData(prev => ({ ...prev, onSale: updatedOnSale }));
    updateProductData?.({ onSale: updatedOnSale });
  };

  // Calculate profit and margin when price or cost changes
  useEffect(() => {
    if (priceData.price && priceData.costOfGoods) {
      const price = parseFloat(priceData.price) || 0;
      const cost = parseFloat(priceData.costOfGoods) || 0;
      const profit = price - cost;
      const margin = price > 0 ? (profit / price) * 100 : 0;
      
      const updatedData = {
        ...priceData,
        profit: profit.toFixed(2),
        margin: margin.toFixed(2)
      };
      setPriceData(updatedData);
      
      // Also update parent with calculated values
      updateProductData?.({
        profit: profit,
        margin: margin
      });
    }
  }, [priceData.price, priceData.costOfGoods]);

  return (
    <ProductLayout productype="price" Body={
      <div className="flex flex-col px-4 py-2 h-full">
        <h1 className="font-bold m-4 text-2xl">Price</h1>
        
        <div className="grid grid-cols-3 gap-4 price-container">
          <input 
            placeholder="Price" 
            type="text" 
            name="price"
            value={priceData.price}
            onChange={handleChange}
            className="border-b-2 p-2 focus:outline-none"
          />
          <select 
            className="border-b-2 p-2 focus:outline-none"
            name="currency"
            value={priceData.currency}
            onChange={handleChange}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
          <input 
            placeholder="SKU" 
            type="text" 
            name="sku"
            value={priceData.sku}
            onChange={handleChange}
            className="border-b-2 p-2 focus:outline-none"
          />

          <div className="col-span-3 ml-6 flex items-center">
            <ToggleButton 
              isOn={priceData.onSale} 
              onToggle={toggleSale} 
              aria-label="Toggle sale status"
            />
            <span className="my-auto mx-3">On Sale</span>
          </div>

          {priceData.onSale && (
            <>
              <input 
                type="text" 
                placeholder="Discount" 
                name="discount"
                value={priceData.discount}
                onChange={handleChange}
                className="border-b-2 p-2 focus:outline-none"
              />
              <div className="col-span-2">
                <input 
                  type="text" 
                  placeholder="Sale price" 
                  name="salePrice"
                  value={priceData.salePrice}
                  onChange={handleChange}
                  className="border-b-2 p-2 w-full focus:outline-none"
                />
              </div>
            </>
          )}

          <input 
            type="text" 
            placeholder="Cost of goods" 
            name="costOfGoods"
            value={priceData.costOfGoods}
            onChange={handleChange}
            className="border-b-2 p-2 focus:outline-none"
          />
          <input 
            type="text" 
            placeholder="Profit" 
            name="profit"
            value={priceData.profit}
            onChange={handleChange}
            className="border-b-2 p-2 focus:outline-none"
            readOnly
          />
          <div className="flex items-center">
            <input 
              type="text" 
              placeholder="Margin" 
              name="margin"
              value={priceData.margin}
              onChange={handleChange}
              className="border-b-2 p-2 w-full focus:outline-none"
              readOnly
            />
            <span className="ml-2">%</span>
          </div>
        </div>
        
        {/* Stock Information Section */}
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Stock Information</h2>
          <div className="flex items-center">
            <input 
              type="number" 
              placeholder="Quantity" 
              name="quantity"
              value={priceData.quantity}
              onChange={handleChange}
              className="border-b-2 p-2 focus:outline-none w-1/3"
              min="0"
            />
            <span className="ml-2 text-gray-500">Available units in stock</span>
          </div>
        </div>
        
        <div className="h-fit w-full flex mt-auto">
          <button 
            onClick={() => setPageNo(1)} 
            className="bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md w-fit"
          >
            Prev
          </button>
          <button 
            onClick={() => setPageNo(3)} 
            className="bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md ml-auto w-fit"
          >
            Next
          </button>
        </div>
      </div>
    } />
  );
};

// Updated Tags component with new submit handling
interface TagsProps extends Omit<ProductProps, 'resetForm'> {
  onSubmit?: (formData: Partial<ProductData>, tags: string[]) => Promise<boolean>;
}

const Tags: React.FC<TagsProps> = ({ setPageNo, updateProductData, productData = {}, onSubmit }) => {
  const [tags, setTags] = useState<string[]>(productData.tags || []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Determine if we're in edit mode based on whether product has an ID
  const isEditMode = Boolean(productData?.id);
  
  // Only update tags from productData on initial mount
  useEffect(() => {
    if (productData.tags) {
      setTags(productData.tags);
    }
  }, []); // Removed productData.tags dependency

  // Update parent whenever tags change
  useEffect(() => {
    updateProductData?.({ tags });
  }, [tags, updateProductData]);

  // Cleaner implementation of fetchSuggestedTags function
  const fetchSuggestedTags = useCallback(async () => {
    if (!productData?.name) {
      setError("Please complete product information first");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Using the endpoint from your instructions
      const response = await fetch("http://localhost:8000/suggest-tags", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: productData.name,
          category: productData.category || '',
          description: productData.description || ''
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data.suggested_tags)) {
        throw new Error('Invalid tags data format from server');
      }

      // Use the suggested_tags from the response
      const newTags = data.suggested_tags
        .filter((tag: unknown) => typeof tag === 'string' && tag.trim())
        .slice(0, 5);

      setTags(newTags);
    } catch (err) {
      console.error("API Error:", err);
      // Fallback to generate some contextual tags
      const fallbackTags = generateContextualTags(productData);
      setTags(fallbackTags);
      setError("Error fetching tags. Using default suggestions instead.");
    } finally {
      setIsLoading(false);
    }
  }, [productData]);

  // Fallback function to generate tags if API fails
  const generateContextualTags = (data: Partial<ProductData>): string[] => {
    if (!data.name) return ["product", "item", "new"];
    
    // Extract tags from product name and category
    const nameTags = data.name.toLowerCase()
      .split(/[\s\-_]+/)
      .filter(word => word.length > 3)
      .map(word => word.replace(/[^a-z0-9-]/g, ''));
    
    const categoryTag = data.category 
      ? data.category.toLowerCase().replace(/\s+/g, '-')
      : "";
    
    // Combine tags and return max 5
    const allTags = Array.from(new Set([...nameTags, categoryTag]))
      .filter(tag => tag && tag.length > 2);
    
    return allTags.length > 0 ? allTags.slice(0, 5) : ["product", "item", "new"];
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim() && tags.length < 5) {
      e.preventDefault();
      const newTag = input.trim();
      if (!tags.includes(newTag)) {
        setTags(prev => [...prev, newTag].slice(0, 5));
      }
      setInput("");
    }
  };

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!productData?.name) {
      setError("Product name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Use the onSubmit callback from parent component
      if (onSubmit) {
        const success = await onSubmit(productData, tags);
        if (success) {
          setSuccessMessage("Successfully added the product");
        }
      }
    } catch (err) {
      console.error("Error during submission:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProductLayout productype="tags" Body={
      <div className="flex flex-col px-4 py-2 h-full">
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500">Tags: {tags.length}/5</span>
            <div className="flex items-center">
              <button 
                onClick={fetchSuggestedTags}
                disabled={isLoading || !productData?.name}
                className={`flex items-center text-sm ${
                  isLoading || !productData?.name 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-500 hover:text-blue-700'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <RefreshCw className="mr-1 animate-spin" size={14} />
                    Generating...
                  </span>
                ) : (
                  <>
                    <RefreshCw className="mr-1" size={14} />
                    <span>Suggest Tags</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="text-sm mb-2 p-2 rounded bg-yellow-50 text-yellow-600">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="text-sm mb-2 p-2 rounded bg-green-50 text-green-600">
              {successMessage}
            </div>
          )}
          
          <div className="border border-gray-200 rounded-xl w-full min-h-[220px] p-4 flex flex-col">
            <input
              type="text"
              placeholder={tags.length >= 5 ? "Maximum 5 tags reached" : "Add your tag (press comma or enter)"}
              className="outline-none px-3 py-2 mb-2 bg-transparent border-b"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={tags.length >= 5}
            />
            
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, idx) => (
                <div
                  key={`${tag}-${idx}`}
                  className="flex items-center bg-gradient-to-r from-black to-[#353535] text-white rounded-full px-3 py-1"
                >
                  <span className="mr-1 text-sm">{tag}</span>
                  <button
                    className="ml-1 text-white focus:outline-none text-sm"
                    onClick={() => removeTag(idx)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-fit w-full flex mt-auto">
          <button 
            onClick={() => setPageNo(2)} 
            className="bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md w-fit"
          >
            Prev
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md ml-auto w-fit ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Processing...' : isEditMode ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    } />
  );
};

// Rename to avoid conflicts with interface ProductProps defined above
type ProductPropsWithSetter = {
    setPageNo: (pageNo: number) => void;
    productData: ProductData;
    setProductData: React.Dispatch<React.SetStateAction<ProductData>>;
    saveProduct?: () => void;
};

// Define initialProductData
const initialProductData: ProductData = {
  name: "",
  description: "",
  detailedDescription: "",
  moq: "",
  category: "",
  hsnCode: "",
  price: 0,
  currency: "USD",
  sku: "",
  onSale: false,
  tags: []
};

// Main Add Product Component - completely overhaul the form reset functionality
export const AddProduct: React.FC = () => {
  const [pageNo, setPageNo] = useState(0);
  const [productData, setProductData] = useState<Partial<ProductData>>({});
  const [formInitialized, setFormInitialized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On component mount, check if we should load saved data, fetch an existing product, or create a new form
  useEffect(() => {
    const loadForm = async () => {
      setIsLoading(true);
      
      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const isNewForm = urlParams.get('new') === 'true';
      const productId = urlParams.get('id');
      
      // If editing an existing product
      if (productId) {
        try {
          setIsEditMode(true);
          console.log(`Editing product with ID: ${productId}`);
          
          // Fetch product data from the API
          const result = await productService.getProductById(productId);
          
          if (result.success && result.product) {
            console.log('Loaded product for editing:', result.product);
            
            // Map the backend data model to our form model
            const formData: Partial<ProductData> = {
              ...result.product,
              description: result.product.preciseDescription, // Backend uses preciseDescription
              tags: result.product.tags || []
            };
            
            // Set the form data
            setProductData(formData);
            localStorage.setItem('productFormData', JSON.stringify(formData));
            setFormInitialized(true);
            setIsLoading(false);
          } else {
            console.error('Failed to fetch product:', result.message);
            setError(`Could not load product: ${result.message}`);
            setFormInitialized(true);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('Error while fetching product:', err);
          setError('Failed to load product details. Please try again.');
          setFormInitialized(true);
          setIsLoading(false);
        }
      }
      // If explicitly creating a new form
      else if (isNewForm) {
        console.log('Creating new form: clearing all saved data');
        localStorage.removeItem('productFormData');
        setProductData(initialProductData);
        setFormInitialized(true);
        setIsLoading(false);
      } 
      // Otherwise try to load saved data
      else {
        const savedData = localStorage.getItem('productFormData');
        if (savedData) {
          try {
            console.log('Loading saved form data');
            setProductData(JSON.parse(savedData));
          } catch (e) {
            console.error('Error parsing saved product data', e);
            setProductData(initialProductData);
          }
        } else {
          setProductData(initialProductData);
        }
        setFormInitialized(true);
        setIsLoading(false);
      }
    };

    loadForm();
  }, []);

  // Create a function to completely reset the form
  const resetForm = useCallback(() => {
    console.log('Resetting form data completely');
    localStorage.removeItem('productFormData');
    setProductData(initialProductData);
  }, []);

  const updateProductData = useCallback((newData: Partial<ProductData>) => {
    if (!formInitialized) return; // Don't update until initialization is complete
    
    setProductData(prev => {
      const updatedData = { ...prev, ...newData };
      // Save to localStorage immediately after state update
      localStorage.setItem('productFormData', JSON.stringify(updatedData));
      return updatedData;
    });
  }, [formInitialized]);

  // Modify Tags component's handleSubmit function to handle both creating and updating
  const handleProductSubmit = useCallback(async (formData: Partial<ProductData>, tags: string[]) => {
    try {
      // Prepare the data according to the backend DTO format
      const submitData = {
        ...formData,
        preciseDescription: formData.description,
        tags: tags
      };

      let result;
      
      // If in edit mode, update the existing product
      if (isEditMode && formData.id) {
        result = await productService.updateProduct(formData.id, submitData);
      } 
      // Otherwise create a new product
      else {
        result = await productService.createProduct(submitData);
      }
      
      if (result.success) {
        // Clear form data immediately
        resetForm();
        
        // Show success message and redirect
        const action = isEditMode ? 'updated' : 'added';
        alert(`Successfully ${action} ${formData.name}! Redirecting to inventory...`);
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/seller/inventory';
        }, 1500);
        
        return true;
      } else {
        alert(result.message || `Failed to ${isEditMode ? 'update' : 'save'} product. Please try again.`);
        return false;
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'submitting'} product:`, err);
      alert(`Failed to ${isEditMode ? 'update' : 'save'} product. Please try again.`);
      return false;
    }
  }, [resetForm, isEditMode]);

  const pages = [
    <ProductInformation 
      setPageNo={setPageNo} 
      updateProductData={updateProductData} 
      productData={productData} 
      key="info" 
    />,
    <Media 
      setPageNo={setPageNo} 
      updateProductData={updateProductData} 
      productData={productData} 
      key="media" 
    />,
    <Price 
      setPageNo={setPageNo} 
      updateProductData={updateProductData} 
      productData={productData} 
      key="price" 
    />,
    <Tags 
      setPageNo={setPageNo} 
      updateProductData={updateProductData} 
      productData={productData} 
      onSubmit={handleProductSubmit}
      key="tags" 
    />
  ];

  // Show loading state while fetching product data
  if (isLoading) {
    return (
      <ProductLayout productype="product" Body={
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      } />
    );
  }

  // Show error message if something went wrong
  if (error) {
    return (
      <ProductLayout productype="product" Body={
        <div className="flex flex-col justify-center items-center h-full p-4">
          <div className="text-red-500 mb-4">{error}</div>
          <a href="/seller/inventory" className="text-blue-500 hover:underline">
            Return to Inventory
          </a>
        </div>
      } />
    );
  }

  // Only render the form once initialization is complete
  return formInitialized ? pages[pageNo] : (
    <ProductLayout productype="product" Body={
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    } />
  );
};

// Inventory Component with real data
export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Fetch products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        if (!authService.getToken()) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const result = await productService.getSellerProducts();
        if (result.success) {
          setProducts(result.products);
        } else {
          if (result.message?.includes('Authentication')) {
            setIsAuthenticated(false);
          } else {
            setError(result.message || "Failed to load products");
          }
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Function to calculate product status based on quantity
  const getProductStatus = (quantity: number) => {
    if (quantity <= 0) return { status: "Out of Stock", className: "bg-red-300 text-red-800" };
    if (quantity < 10) return { status: "Low Stock", className: "bg-yellow-200 text-yellow-800" };
    return { status: "In Stock", className: "bg-green-200 text-green-800" };
  };

  return (
    <div className="flex flex-col w-[80%] h-fit mx-auto my-14 shadow-lg rounded-lg border-[#00000021] border-[2px] p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-2xl">All Products</h1>
          <p className="text-[#00000048]">Manage your product inventory</p>
        </div>
        <div>
          <a href="/seller/add-product?new=true">
            <button className="mx-3 bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-2 rounded-md w-fit">
              New Product
            </button>
          </a>
          <button className="mx-3 border-[1px] text-blue-500 border-blue-500 px-8 py-2 rounded-md w-fit">
            Import CSV File
          </button>
          <button className="mx-3 border-[1px] text-blue-500 border-blue-500 px-8 py-2 rounded-md w-fit">
            Export CSV File
          </button>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="text-center text-red-500 my-8 p-4 bg-red-50 rounded">
          <p className="mb-4">You need to be logged in to view your products.</p>
          <a href="/login" className="bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-2 rounded-md">
            Login
          </a>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 my-8 p-4 bg-red-50 rounded">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-500 my-8 p-4">
          <p className="mb-4">You haven't added any products yet.</p>
          <a href="/seller/add-product?new=true" className="text-blue-500 hover:underline">
            Add your first product
          </a>
        </div>
      ) : (
        <div className="overflow-x-auto my-8">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Product</th>
                <th className="py-3 px-6 text-left">Category</th>
                <th className="py-3 px-6 text-left">Price</th>
                <th className="py-3 px-6 text-left">SKU</th>
                <th className="py-3 px-6 text-left">Quantity</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {products.map((product) => {
                // Default quantity to 0 if not provided
                const quantity = (product as any).quantity || 0;
                const { status, className } = getProductStatus(quantity);
                
                return (
                  <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-6 px-6 text-left">
                      <input type="checkbox" className="form-checkbox" />
                      <span className="ml-2">{product.name}</span>
                    </td>
                    <td className="py-6 px-6 text-left">{product.category || 'Uncategorized'}</td>
                    <td className="py-6 px-6 text-left">${product.price?.toFixed(2) || '0.00'}</td>
                    <td className="py-6 px-6 text-left">{product.sku || 'N/A'}</td>
                    <td className="py-6 px-6 text-left">{quantity}</td>
                    <td className="py-6 px-6 text-left">
                      <span className={`py-1 px-3 rounded-full text-xs ${className}`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-6 px-6 text-left">
                      <a href={`/seller/add-products?id=${product.id}`} className="text-blue-500 hover:text-blue-700">Edit</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Incoterms Component
export const Incoterms: React.FC = () => (
  <div className="flex flex-col w-[80%] h-fit mx-auto my-14 shadow-lg rounded-lg border-[#00000021] border-[2px] p-8">
    <h1 className="font-bold text-2xl mb-4">Incoterms</h1>
    <p className="text-gray-500">Incoterms configuration will be available soon.</p>
  </div>
);
