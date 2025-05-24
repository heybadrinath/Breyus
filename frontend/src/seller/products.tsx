import React, { useCallback, useEffect, useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Trash, Package, AlertTriangle, CheckCircle, Edit2 } from "lucide-react";
import "../seller/css/product.css";
import { Layout } from "./components";
import productService from "../services/product.service";
import authService from "../services/auth.service";
import { Product } from "../types/product";

const variants = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 }
};

// Product Layout Component
const ProductLayout = ({ productype, Body }: { productype: string, Body: ReactNode }) => {
  const steps = ["product", "media", "price", "tags"];
  const currentIndex = steps.indexOf(productype);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="relative p-6 bg-gray-50 min-h-screen overflow-y-auto"
    >
      <div className="step-indicator mb-8">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`step ${index <= currentIndex ? 'active' : ''}`}
          >
            <div className="step-number">{index + 1}</div>
            <span className="step-label">{step.charAt(0).toUpperCase() + step.slice(1)}</span>
          </div>
        ))}
      </div>
      
      <div className="max-w-6xl mx-auto">
        {Body}
      </div>
    </motion.div>
  );
};

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
    <div className="w-full animate-slide-in">
      <label
        htmlFor="image-upload-input"
        className={`image-upload-container ${dragActive ? "dragging" : ""}`}
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
          <div className="flex flex-col items-center transition-all duration-300 transform hover:scale-105">
            <RefreshCw className="w-12 h-12 text-gray-400 mb-3" />
            <span className="text-gray-500 text-base text-center">
              Drop image files here<br />or <span className="underline text-blue-500">browse</span>
          </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center">
            {files.map((file, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-20 h-20 object-cover rounded-md border shadow-sm image-upload-preview"
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
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">{isEditMode ? 'Edit Product' : 'Product Information'}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="form-field">
          <input 
              placeholder="Product Name" 
              className="w-full" 
            type="text" 
            name="name" 
            value={formData.name}
            onChange={handleChange}
          />
          </div>
          <div className="form-field">
          <select 
              className="w-full bg-transparent"
            name="moq"
            value={formData.moq}
            onChange={handleChange}
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
              value={formData.description}
              onChange={handleChange}
            />
            </div>
            <textarea 
              placeholder="Detailed Description - Include product specifications, features, and benefits" 
              className="w-full h-[180px] border border-gray-200 rounded-b-lg px-3 py-2" 
              name="detailedDescription"
              value={formData.detailedDescription}
              onChange={handleChange}
            />
          </div>
          
          <div className="product-card flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Product Details</h2>
            <div className="form-field mb-6">
            <select 
                className="w-full" 
              name="category"
              value={formData.category}
              onChange={handleChange}
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
              value={formData.hsnCode}
              onChange={handleChange}
            />
              <p className="text-xs text-gray-500 mt-1">Harmonized System Nomenclature code for product classification</p>
          </div>
        </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button 
            onClick={() => setPageNo(1)} 
            className="product-btn"
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
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">Media</h1>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 product-card">
            <h2 className="text-lg font-semibold mb-3">Product Images</h2>
            <p className="text-gray-500 text-sm mb-4">Upload product photos (max 5 images)</p>
            <ImageUpload onChange={handleProductImagesChange} value={productImages} />
          </div>
          <div className="flex-1 product-card">
            <h2 className="text-lg font-semibold mb-3">Test Reports</h2>
            <p className="text-gray-500 text-sm mb-4">Upload test certificates (PDF, JPG)</p>
            <ImageUpload onChange={handleTestReportsChange} value={testReports} />
          </div>
        </div>
        <div className="mt-8 flex justify-between">
          <button 
            onClick={() => setPageNo(0)} 
            className="product-btn-prev"
          >
            Previous
          </button>
          <button 
            onClick={() => setPageNo(2)} 
            className="product-btn"
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
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">Price</h1>
        
        <div className="product-card animate-slide-in">
          <h2 className="text-lg font-semibold mb-4">Basic Pricing</h2>
          <div className="price-container grid-cols-3">
            <div className="form-field">
          <input 
            placeholder="Price" 
            type="text" 
            name="price"
            value={priceData.price}
            onChange={handleChange}
                className="w-full"
          />
            </div>
            <div className="form-field">
          <select 
                className="w-full"
            name="currency"
            value={priceData.currency}
            onChange={handleChange}
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
            value={priceData.sku}
            onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        <div className="product-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Discounts</h2>
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-700">On Sale</span>
              <ToggleButton isOn={priceData.onSale} onToggle={toggleSale} />
            </div>
          </div>

          <div className="price-container grid-cols-2">
            <div className="form-field">
              <input 
                placeholder="Discount %" 
                type="text" 
                name="discount"
                value={priceData.discount}
                onChange={handleChange}
                disabled={!priceData.onSale}
                className={`w-full ${!priceData.onSale ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="form-field">
                <input 
                placeholder="Sale Price" 
                  type="text" 
                  name="salePrice"
                  value={priceData.salePrice}
                  onChange={handleChange}
                disabled={!priceData.onSale}
                className={`w-full ${!priceData.onSale ? 'opacity-50' : ''}`}
                />
              </div>
          </div>
        </div>

        <div className="product-card animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold mb-4">Inventory & Profit</h2>
          <div className="price-container grid-cols-3">
            <div className="form-field">
          <input 
                placeholder="Cost of Goods" 
            type="text" 
            name="costOfGoods"
            value={priceData.costOfGoods}
            onChange={handleChange}
                className="w-full"
          />
            </div>
            <div className="form-field">
          <input 
            placeholder="Profit" 
                type="text" 
            name="profit"
            value={priceData.profit}
            readOnly
                className="w-full bg-gray-50"
          />
            </div>
            <div className="form-field">
            <input 
                placeholder="Margin %" 
              type="text" 
              name="margin"
              value={priceData.margin}
              readOnly
                className="w-full bg-gray-50"
            />
          </div>
        </div>
          
          <div className="form-field mt-4">
            <label className="block text-gray-700 font-medium mb-2">Product Quantity</label>
            <input 
              placeholder="Enter available product quantity" 
              type="number" 
              name="quantity"
              value={priceData.quantity}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
            <p className="text-sm text-gray-500 mt-1">Number of units currently in stock</p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button 
            onClick={() => setPageNo(1)} 
            className="product-btn-prev"
          >
            Previous
          </button>
          <button 
            onClick={() => setPageNo(3)} 
            className="product-btn"
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
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">Tags</h1>
        
        <div className="product-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Product Tags <span className="text-sm text-gray-500">({tags.length}/5)</span></h2>
              <button 
                onClick={fetchSuggestedTags}
                disabled={isLoading || !productData?.name}
              className={`flex items-center text-sm px-3 py-1.5 rounded-md ${
                  isLoading || !productData?.name 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
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
                  <span>Auto-Generate Tags</span>
                  </>
                )}
              </button>
          </div>
          
          {error && (
            <div className="text-sm mb-4 p-3 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="text-sm mb-4 p-3 rounded bg-green-50 text-green-700 border border-green-200">
              {successMessage}
            </div>
          )}
          
          <div className="border border-gray-200 rounded-xl p-4 mb-4">
            <input
              type="text"
              placeholder={tags.length >= 5 ? "Maximum 5 tags reached" : "Add your tag (press Enter or comma)"}
              className="outline-none px-3 py-2 mb-4 bg-transparent border-b border-gray-200 w-full focus:border-gray-400 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={tags.length >= 5}
            />
            
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, idx) => (
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
              ))}
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
            onClick={() => setPageNo(2)} 
            className="product-btn-prev"
          >
            Previous
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`product-btn ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
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
              id: result.product.id,
              name: result.product.name || '',
              description: result.product.preciseDescription || '',
              detailedDescription: result.product.detailedDescription || '',
              category: result.product.category || '',
              hsnCode: result.product.hsnCode || '',
              moq: result.product.moq || '',
              price: result.product.price || 0,
              currency: result.product.currency || 'USD',
              sku: result.product.sku || '',
              quantity: result.product.quantity || 0,
              onSale: result.product.onSale || false,
              discount: result.product.discount || 0,
              salePrice: result.product.salePrice || 0,
              costOfGoods: result.product.costOfGoods || 0,
              margin: result.product.margin || 0,
              profit: result.product.profit || 0,
              productImage: result.product.productImage || '',
              testReports: result.product.testReports || '',
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
        // Don't clear form data immediately - removed resetForm() call
        
        // Show success message without redirecting
        const action = isEditMode ? 'updated' : 'added';
        alert(`Successfully ${action} ${formData.name}!`);
        
        // No redirect - just return to the same form
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
  }, [isEditMode]); // Removed resetForm dependency

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

// Enhance the Inventory component with refresh functionality
// Update the Inventory component

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch products when component mounts
  const fetchProducts = useCallback(async () => {
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
        setLastUpdated(new Date());
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
  }, []);

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Function to handle refresh
  const handleRefresh = () => {
    setError(null);
    fetchProducts();
  };

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
          <p className="text-[#00000048]">
            Manage your product inventory
            {lastUpdated && (
              <span className="ml-2 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center">
          <button 
            onClick={handleRefresh} 
            className="mr-3 flex items-center gap-2 text-blue-500 hover:text-blue-700 px-4 py-2 rounded-md"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <a href="/seller/add-products?new=true">
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
          <button 
            onClick={handleRefresh}
            className="ml-4 text-blue-500 hover:text-blue-700 underline"
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-500 my-8 p-4">
          <p className="mb-4">You haven't added any products yet.</p>
          <a href="/seller/add-products?new=true" className="text-blue-500 hover:underline">
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
