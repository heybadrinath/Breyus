import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import "../seller/css/product.css";

// Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Type Definitions
interface ProductData {
  name: string;
  category?: string;
  description?: string;
  moq?: string;
  detailedDescription?: string;
  hsnCode?: string;
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

// Product Layout Component
const ProductLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-[840px] h-[fit] mx-auto my-14 flex flex-col">
    <div className="w-[850px] h-[600px] px-4 absolute py-8 translate-y-16 border-[#00000021] shadow-lg rounded-lg border-[2px]">
      {children}
    </div>
  </div>
);

// Product Information Component
const ProductInformation: React.FC<ProductProps> = ({ setPageNo, updateProductData }) => {
  const [formData, setFormData] = useState<Omit<ProductData, 'category'> & { category: string }>({
    name: "",
    moq: "",
    description: "",
    detailedDescription: "",
    category: "",
    hsnCode: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const stableUpdateProductData = useCallback((data: Partial<ProductData>) => {
    updateProductData?.(data);
  }, [updateProductData]);

  useEffect(() => {
    stableUpdateProductData(formData);
  }, [formData, stableUpdateProductData]);

  return (
    <ProductLayout>
      <div className="flex flex-col h-full px-4 py-2">
        <h1 className="font-bold m-4 text-2xl">Product Information</h1>
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
    </ProductLayout>
  );
};

// Media Component
const Media: React.FC<ProductProps> = ({ setPageNo }) => {
  const [productImages, setProductImages] = useState<File[]>([]);
  const [testReports, setTestReports] = useState<File[]>([]);

  return (
    <ProductLayout>
      <div className="flex flex-col px-4 py-2 h-full">
        <h1 className="font-bold m-4 text-2xl">Media</h1>
        <div className="flex justify-between w-full">
          <div className="w-[48%]">
            <p className="font-medium mb-2">Product Image</p>
            <ImageUpload onChange={setProductImages} value={productImages} />
          </div>
          <div className="w-[48%]">
            <p className="font-medium mb-2">Test Report Files</p>
            <ImageUpload onChange={setTestReports} value={testReports} />
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
    </ProductLayout>
  );
};

// Price Component
const Price: React.FC<ProductProps> = ({ setPageNo }) => {
  const [priceData, setPriceData] = useState<PriceData>({
    price: "",
    currency: "USD",
    sku: "",
    onSale: false,
    discount: "",
    salePrice: "",
    costOfGoods: "",
    profit: "",
    margin: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPriceData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSale = () => {
    setPriceData(prev => ({ ...prev, onSale: !prev.onSale }));
  };

  useEffect(() => {
    if (priceData.price && priceData.costOfGoods) {
      const price = parseFloat(priceData.price) || 0;
      const cost = parseFloat(priceData.costOfGoods) || 0;
      const profit = price - cost;
      const margin = price > 0 ? (profit / price) * 100 : 0;
      
      setPriceData(prev => ({
        ...prev,
        profit: profit.toFixed(2),
        margin: margin.toFixed(2)
      }));
    }
  }, [priceData.price, priceData.costOfGoods]);

  return (
    <ProductLayout>
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
    </ProductLayout>
  );
};

// Improved Tags Component with cleaner tag suggestion implementation
const Tags: React.FC<ProductProps> = ({ setPageNo, productData = {} }) => {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <ProductLayout>
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
            
            {tags.length === 0 && (
              <div className="text-gray-400 text-center mt-4">
                Click "Suggest Tags" to auto-generate tags based on your product details, 
                or add tags manually.
              </div>
            )}
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
            className="bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-1 rounded-md ml-auto w-fit"
          >
            Add your Terms
          </button>
        </div>
      </div>
    </ProductLayout>
  );
};

// Main Add Product Component
export const AddProduct: React.FC = () => {
  const [pageNo, setPageNo] = useState(0);
  const [productData, setProductData] = useState<Partial<ProductData>>({});

  const updateProductData = useCallback((newData: Partial<ProductData>) => {
    setProductData(prev => ({ ...prev, ...newData }));
  }, []);

  const pages = [
    <ProductInformation setPageNo={setPageNo} updateProductData={updateProductData} key="info" />,
    <Media setPageNo={setPageNo} key="media" />,
    <Price setPageNo={setPageNo} key="price" />,
    <Tags setPageNo={setPageNo} productData={productData} key="tags" />
  ];

  return pages[pageNo];
};

// Inventory Component
export const Inventory: React.FC = () => {
  const [products] = useState([
    { id: 1, name: "Product 1", category: "Oils", price: "$1298", sku: "22423232", quantity: 0, status: "Out of Stock" },
    { id: 2, name: "Product 2", category: "Oils", price: "$1298", sku: "22423233", quantity: 10, status: "In Stock" },
    { id: 3, name: "Product 3", category: "Oils", price: "$1298", sku: "22423234", quantity: 5, status: "In Stock" },
    { id: 4, name: "Product 4", category: "Oils", price: "$1298", sku: "22423235", quantity: 20, status: "In Stock" },
    { id: 5, name: "Product 5", category: "Oils", price: "$1298", sku: "22423236", quantity: 15, status: "In Stock" }
  ]);

  return (
    <div className="flex flex-col w-[80%] h-fit mx-auto my-14 shadow-lg rounded-lg border-[#00000021] border-[2px] p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-2xl">All Products</h1>
          <p className="text-[#00000048]">Manage your product inventory</p>
        </div>
        <div>
          <button className="mx-3 bg-gradient-to-r from-[#000000] to-[#353535D9] text-white px-8 py-2 rounded-md w-fit">
            New Product
          </button>
          <button className="mx-3 border-[1px] text-blue-500 border-blue-500 px-8 py-2 rounded-md w-fit">
            Import CSV File
          </button>
          <button className="mx-3 border-[1px] text-blue-500 border-blue-500 px-8 py-2 rounded-md w-fit">
            Export CSV File
          </button>
        </div>
      </div>

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
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-6 px-6 text-left">
                  <input type="checkbox" className="form-checkbox" />
                  <span className="ml-2">{product.name}</span>
                </td>
                <td className="py-6 px-6 text-left">{product.category}</td>
                <td className="py-6 px-6 text-left">{product.price}</td>
                <td className="py-6 px-6 text-left">{product.sku}</td>
                <td className="py-6 px-6 text-left">{product.quantity}</td>
                <td className="py-6 px-6 text-left">
                  <span className={`py-1 px-3 rounded-full text-xs ${
                    product.status === "In Stock" 
                      ? "bg-green-200 text-green-800" 
                      : "bg-red-300 text-red-800"
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="py-6 px-6 text-left">
                  <button className="text-blue-500 hover:text-blue-700">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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