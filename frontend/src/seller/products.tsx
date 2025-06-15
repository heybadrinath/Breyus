import React, { useCallback, useEffect, useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Trash, Package, AlertTriangle, CheckCircle, Edit2 } from "lucide-react";
import "../seller/css/product.css";
import { Layout } from "./components";
import productService from "../services/product.service";
import authService from "../services/auth.service";
import { Product } from "../types/product";
import ProgressBar from "../buyer/components/cart/PurchaseRequestProgress";

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'https://breyus.com/backend';

// Helper function to get proper image URL from different sources
const getImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) {
    return '/placeholder-product.svg';
  }

  // Handle URLs - blob URLs for local file preview, http/https for remote files, or data URLs
  if (imagePath.startsWith('blob:') ||
    imagePath.startsWith('http:') ||
    imagePath.startsWith('https:') ||
    imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Handle relative paths that need server URL prefix
  return `${API_URL}/uploads/${imagePath}`;
};

const variants = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 }
};

// Product Layout Component
const ProductLayout = ({ productype, Body }: { productype: string, Body: ReactNode }) => {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="mx-auto  rounded-lg w-[60%] px-12 relative pt-14 pb-8 border-gray-200 border"
    >
      {Body}
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

interface ProductApiData {
  id?: string;
  name: string;
  preciseDescription?: string;
  detailedDescription?: string;
  category?: string;
  hsnCode?: string;
  moq?: string;
  productImage?: string;
  testReports?: string;
  price?: number;
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

interface ProductProps {
  setPageNo?: (pageNo: number) => void; // Made setPageNo optional
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
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isOn ? 'bg-blue-600' : 'bg-gray-200'
      } ${className}`}
    {...props}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'
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
                className="w-20 h-20 object-cover rounded-md border  image-upload-preview"
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
  const [formData, setFormData] = useState<Omit<ProductData, 'category'> & { category: string }>(() => ({
    name: productData.name || "",
    moq: productData.moq || "",
    description: productData.description || "",
    detailedDescription: productData.detailedDescription || "",
    category: productData.category || "",
    hsnCode: productData.hsnCode || ""
  }));

  // Determine if we're in edit mode based on whether product has an ID
  const isEditMode = Boolean(productData?.id);

  // Update local state when relevant productData props change
  useEffect(() => {
    setFormData({
      name: productData.name || "",
      moq: productData.moq || "",
      description: productData.description || "",
      detailedDescription: productData.detailedDescription || "",
      category: productData.category || "",
      hsnCode: productData.hsnCode || ""
    });
  }, [
    productData.name,
    productData.moq,
    productData.description,
    productData.detailedDescription,
    productData.category,
    productData.hsnCode
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    // Update parent data immediately, but debounced to prevent too many updates
    updateProductData?.(updatedData);
  };

  const handleNext = () => {
    if (setPageNo) setPageNo(1); // Check if setPageNo is defined
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
            onClick={handleNext}
            type="button"
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

    if (files.length > 0) {
      // Create a local object URL for temporary display purposes during form editing
      const localImageUrl = URL.createObjectURL(files[0]);
      // Store the local URL in product data for preview
      updateProductData?.({
        productImage: localImageUrl
      });
    } else {
      updateProductData?.({
        productImage: undefined
      });
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

  const handleNext = () => {
    if (setPageNo) setPageNo(2); // Go directly to Price (skip removed Inventory and Incoterms)
  };

  const handlePrev = () => {
    if (setPageNo) setPageNo(0); // Check if setPageNo is defined
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
            onClick={handlePrev}
            type="button"
            className="product-btn-prev"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            type="button"
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
  const [priceData, setPriceData] = useState<PriceData>(() => ({
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
  }));

  // Update local state when relevant productData props change
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
  }, [
    productData.price,
    productData.currency,
    productData.sku,
    productData.onSale,
    productData.discount,
    productData.salePrice,
    productData.costOfGoods,
    productData.profit,
    productData.margin,
    productData.quantity
  ]);

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

      const updatedCalculatedData = {
        profit: profit.toFixed(2),
        margin: margin.toFixed(2)
      };
      setPriceData(prev => ({ ...prev, ...updatedCalculatedData }));

      // Also update parent with calculated values
      if (updateProductData) {
        updateProductData({
          profit: profit,
          margin: margin
        });
      }
    }
  }, [priceData.price, priceData.costOfGoods, updateProductData]);

  const handleNext = () => {
    if (setPageNo) setPageNo(3); // Go directly to Tags (skip Inventory and Incoterms)
  };

  const handlePrev = () => {
    if (setPageNo) setPageNo(1); // Check if setPageNo is defined
  };
  return (
    <ProductLayout productype="price" Body={
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">Price</h1>

        <div className="product-card animate-slide-in shadow-none">
          {/* Section-1 */}
          <h2 className="text-lg font-semibold mb-2">Basic Pricing</h2>
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

          {/* Section -2  */}
          <div className="flex justify-between items-center mb-2">
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

          {/* Section -3 */}
          <h2 className="text-lg font-semibold mb-2">Inventory & Profit</h2>
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

          <div className="form-field">
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

        <div className="mt-2 flex justify-between">
          <button
            onClick={handlePrev}
            type="button"
            className="product-btn-prev"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            type="button"
            className="product-btn"
          >
            Next
          </button>
        </div>
      </div>
    } />
  );
};

// Inventory Management Component - Product Listing Page
export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Changed from 10 to 5 to match image
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getSellerProducts();
      if (response.success) {
        setProducts(response.products);
      } else {
        setError(response.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await productService.deleteProduct(productId);
      if (response.success) {
        setShowDeleteModal(false);
        setProductToDelete(null);
        // Refresh products after deletion
        await fetchProducts();
        // Show success message briefly
        setError(null);
      } else {
        setError(response.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    try {
      const productIds = Array.from(selectedProducts);
      const response = await productService.bulkDeleteProducts(productIds);

      if (response.success) {
        setSelectedProducts(new Set());
        await fetchProducts();
        setError(null);
        // Could show a success message here if needed
      } else {
        setError(response.message || 'Failed to delete selected products');
      }
    } catch (err) {
      console.error('Error bulk deleting products:', err);
      setError('Failed to delete selected products');
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    const matchesStatus = !filterStatus ||
      (filterStatus === 'in-stock' && product.quantity > 0) ||
      (filterStatus === 'out-of-stock' && product.quantity === 0) ||
      (filterStatus === 'low-stock' && product.quantity > 0 && product.quantity <= 10);

    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === 'price') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else if (sortBy === 'quantity') {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    } else {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (quantity <= 10) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col mb-4">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Product Inventory</h1>
              <p className="text-gray-600 mt-1">Manage your product listings and stock levels</p>
            </div>
            <div className="flex justify-center gap-4">
              <a
                href='/seller/add-products?new=true'
                className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-none font-medium transition-colors duration-200"
              >
                New Product
              </a>
              <a
                href='#'
                className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-none font-medium transition-colors duration-200"
              >
                Import CSV File
              </a>
              <a
                href='#'
                className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-none font-medium transition-colors duration-200"
              >
                Export CSV File
              </a>
              <button
                onClick={fetchProducts}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ml-4"
                title="Refresh inventory"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 text-sm font-medium">Total Products</div>
              <div className="text-2xl font-bold text-blue-900">{products.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 text-sm font-medium">In Stock</div>
              <div className="text-2xl font-bold text-green-900">
                {products.filter(p => p.quantity > 10).length}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-yellow-600 text-sm font-medium">Low Stock</div>
              <div className="text-2xl font-bold text-yellow-900">
                {products.filter(p => p.quantity > 0 && p.quantity <= 10).length}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-red-600 text-sm font-medium">Out of Stock</div>
              <div className="text-2xl font-bold text-red-900">
                {products.filter(p => p.quantity === 0).length}
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Categories</option>
                <option value="Oils">Oils</option>
                <option value="dummy-1">Category 1</option>
                <option value="dummy-2">Category 2</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Stock Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="price-asc">Price Low-High</option>
                <option value="price-desc">Price High-Low</option>
                <option value="quantity-asc">Stock Low-High</option>
                <option value="quantity-desc">Stock High-Low</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg mb-4">
              <span className="text-blue-700 font-medium">
                {selectedProducts.size} product(s) selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors duration-200"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedProducts(new Set())}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-6">
                {products.length === 0
                  ? "You haven't added any products yet. Start by adding your first product!"
                  : "No products match your current filters. Try adjusting your search criteria."
                }
              </p>
              {products.length === 0 && (
                <a
                  href='/seller/add-products?new=true'
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-none font-medium transition-colors duration-200 inline-block"
                >
                  New Product
                </a>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                          onChange={selectAllProducts}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentProducts.map((product) => {
                      const stockStatus = getStockStatus(product.quantity || 0);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-16 w-16 flex-shrink-0">
                                <img
                                  className="h-16 w-16 rounded-lg object-cover border"
                                  src={getImageUrl(product.productImage)}
                                  alt={product.name}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder-product.svg';
                                  }}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                  {product.name || 'Untitled Product'}
                                </div>
                                <div className="text-sm text-gray-500 line-clamp-1">
                                  {product.description || 'No description'}
                                </div>
                                {product.hsnCode && (
                                  <div className="text-xs text-gray-400">
                                    HSN: {product.hsnCode}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {product.category || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-medium">{formatPrice(product.price)}</div>
                            {product.salePrice && product.onSale && (
                              <div className="text-xs text-green-600">
                                Sale: {formatPrice(product.salePrice)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-medium">{product.quantity || 0} units</div>
                            {product.moq && (
                              <div className="text-xs text-gray-500">
                                MOQ: {product.moq}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                              {stockStatus.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <a
                                href={`/seller/product/${product.id}`}
                                className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                title="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </a>
                              <a
                                href={`/seller/add-products?id=${product.id}`}
                                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                                title="Edit Product"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </a>
                              <button
                                onClick={() => {
                                  setProductToDelete(product.id);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                title="Delete Product"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </div>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages === 0) return null; // No pages to display
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 border text-sm font-medium rounded-md ${currentPage === pageNum
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Product</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this product? This will permanently remove the product from your inventory.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => productToDelete && handleDeleteProduct(productToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Placeholder for Incoterms Component
export const Incoterms: React.FC<ProductProps> = ({ setPageNo, updateProductData, productData }) => {
  // Add actual incoterms form fields and logic here
  const handleNext = () => {
    if (setPageNo) setPageNo(5); // Check if setPageNo is defined
  };

  const handlePrev = () => {
    if (setPageNo) setPageNo(3); // Check if setPageNo is defined
  };

  return (
    <ProductLayout productype="incoterms" Body={
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl">Incoterms</h1>
        <p className="text-gray-600 mb-4">
          Specify International Commercial Terms for shipping and delivery.
        </p>
        {/* Example Field (to be replaced with actual incoterms fields) */}
        <div className="form-field mb-6">
          <label htmlFor="incoterm" className="block text-sm font-medium text-gray-700 mb-1">Select Incoterm</label>
          <select
            name="incoterm"
            id="incoterm"
            // value={productData?.incoterm || ''} // Assuming an 'incoterm' field in ProductData
            // onChange={(e) => updateProductData?.({ incoterm: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>Select an Incoterm</option>
            <option value="EXW">EXW (Ex Works)</option>
            <option value="FOB">FOB (Free On Board)</option>
            <option value="CIF">CIF (Cost, Insurance and Freight)</option>
            {/* Add other incoterms as needed */}
          </select>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={handlePrev}
            type="button"
            className="mr-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            type="button"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Determine if we're in edit mode based on whether product has an ID
  const isEditMode = Boolean(productData?.id);

  // Sync local tags state with productData.tags prop
  useEffect(() => {
    if (productData.tags && JSON.stringify(productData.tags) !== JSON.stringify(tags)) {
      setTags(productData.tags);
    }
  }, [productData.tags]); // Removed tags from dependency to avoid loop with parent update

  // Removed the useEffect that was previously here to sync tags back to parent immediately.
  // updateProductData will be called directly in handlers.

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
      if (updateProductData) {
        updateProductData({ tags: newTags });
      }
    } catch (err) {
      console.error("API Error:", err);
      // Fallback to generate some contextual tags
      const fallbackTags = generateContextualTags(productData);
      setTags(fallbackTags);
      if (updateProductData) {
        updateProductData({ tags: fallbackTags });
      }
      setError("Error fetching tags. Using default suggestions instead.");
    } finally {
      setIsLoading(false);
    }
  }, [productData, updateProductData]); // Added updateProductData

  // Fallback function to generate tags if API fails
  const generateContextualTags = useCallback((data: Partial<ProductData>): string[] => {
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
  }, []); // No dependencies needed if it only relies on its arguments

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim() && tags.length < 5) {
      e.preventDefault();
      const newTag = input.trim();
      if (!tags.includes(newTag)) {
        const newTags = [...tags, newTag].slice(0, 5);
        setTags(newTags);
        if (updateProductData) {
          updateProductData({ tags: newTags });
        }
      }
      setInput("");
    }
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    if (updateProductData) {
      updateProductData({ tags: newTags });
    }
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

  const handlePrev = () => {
    if (setPageNo) setPageNo(2); // Go back to Price page (was previously pointing to removed Inventory page)
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
              className={`flex items-center text-sm px-3 py-1.5 rounded-md ${isLoading || !productData?.name
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
            onClick={handlePrev}
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
  const [productData, setProductData] = useState<Partial<ProductData>>(initialProductData);
  const [formInitialized, setFormInitialized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadForm = async () => {
      setIsLoading(true);
      setError(null);
      const urlParams = new URLSearchParams(window.location.search);
      const isNewForm = urlParams.get('new') === 'true';
      const productId = urlParams.get('id');

      if (productId) {
        try {
          setIsEditMode(true);
          const result = await productService.getProductById(productId);
          if (result.success && result.product) {
            const fetchedProduct = result.product as Product; // Cast to full Product type
            const formData: Partial<ProductData> = {
              id: fetchedProduct.id,
              name: fetchedProduct.name || '',
              description: fetchedProduct.preciseDescription || fetchedProduct.description || '',
              detailedDescription: fetchedProduct.detailedDescription || '',
              category: fetchedProduct.category || '',
              hsnCode: fetchedProduct.hsnCode || '',
              moq: fetchedProduct.moq || '',
              price: fetchedProduct.price || 0,
              currency: (fetchedProduct as any).currency || 'USD', // Assuming currency might not be in Product type
              sku: fetchedProduct.sku || '',
              quantity: fetchedProduct.quantity || 0,
              onSale: fetchedProduct.onSale || false,
              discount: fetchedProduct.discount || 0,
              salePrice: fetchedProduct.salePrice || 0,
              costOfGoods: fetchedProduct.costOfGoods || 0,
              margin: fetchedProduct.margin || 0,
              profit: fetchedProduct.profit || 0,
              productImage: fetchedProduct.productImage || '',
              testReports: fetchedProduct.testReports || '',
              tags: fetchedProduct.tags || []
            };
            setProductData(formData);
            localStorage.setItem('productFormData', JSON.stringify(formData));
          } else {
            setError(`Could not load product: ${result.message}`);
          }
        } catch (err) {
          setError('Failed to load product details. Please try again.');
        }
      } else if (isNewForm) {
        localStorage.removeItem('productFormData');
        setProductData(initialProductData);
        setPageNo(0);
      } else {
        const savedData = localStorage.getItem('productFormData');
        if (savedData) {
          try {
            setProductData(JSON.parse(savedData));
          } catch (e) {
            localStorage.removeItem('productFormData');
            setProductData(initialProductData);
          }
        } else {
          setProductData(initialProductData);
        }
      }
      setFormInitialized(true);
      setIsLoading(false);
    };
    loadForm();
  }, []);

  const updateProductData = useCallback((data: Partial<ProductData>) => {
    setProductData(prev => {
      const newData = { ...prev, ...data };
      if (!isEditMode || (isEditMode && formInitialized)) {
        localStorage.setItem('productFormData', JSON.stringify(newData));
      }
      return newData;
    });
  }, [isEditMode, formInitialized]);

  const resetForm = useCallback(() => {
    localStorage.removeItem('productFormData');
    setProductData(initialProductData);
    setPageNo(0);
    setIsEditMode(false);
    // Consider navigating to ?new=true to ensure a full reset via useEffect
    // window.location.search = '?new=true'; 
  }, []);

  const handleProductSubmit = useCallback(async (currentProductData: Partial<ProductData>, tagsToSubmit: string[]) => {
    setError(null);

    // Prepare data for submission, aligning with the CreateProductDto
    const dataForApi: ProductApiData = {
      name: currentProductData.name || "",
      preciseDescription: currentProductData.description || "",
      detailedDescription: currentProductData.detailedDescription || "",
      category: currentProductData.category || "",
      hsnCode: currentProductData.hsnCode || "",
      moq: currentProductData.moq || "",
      productImage: currentProductData.productImage?.startsWith('blob:')
        ? `product-${Date.now()}.jpg`
        : currentProductData.productImage || "",
      testReports: currentProductData.testReports || "",
      price: Number(currentProductData.price) || 0,
      sku: currentProductData.sku || "",
      onSale: currentProductData.onSale || false,
      discount: Number(currentProductData.discount) || 0,
      salePrice: Number(currentProductData.salePrice) || 0,
      costOfGoods: Number(currentProductData.costOfGoods) || 0,
      profit: Number(currentProductData.profit) || 0,
      margin: Number(currentProductData.margin) || 0,
      quantity: Number(currentProductData.quantity) || 0,
      tags: tagsToSubmit || []
    };

    // Only include id if we're in edit mode
    if (isEditMode && currentProductData.id) {
      dataForApi.id = currentProductData.id;
    }

    // Remove any undefined or null values
    const cleanData = Object.fromEntries(
      Object.entries(dataForApi).filter(([_, value]) => value !== undefined && value !== null)
    );

    console.log('Submitting product data:', cleanData);

    try {
      let result;
      if (isEditMode && dataForApi.id) {
        result = await productService.updateProduct(dataForApi.id, cleanData);
      } else {
        const { id, ...newData } = cleanData;
        result = await productService.createProduct(newData);
      }

      if (result.success) {
        resetForm();
        // Redirect to inventory page after successful submission
        window.location.href = '/seller/inventory';
        return true;
      } else {
        setError(result.message || 'Failed to submit product.');
        return false;
      }
    } catch (err: any) {
      console.error('Error submitting product:', err);
      setError(err.message || 'An unexpected error occurred during submission.');
      return false;
    }
  }, [resetForm, isEditMode]);

  if (isLoading) {
    return <ProductLayout productype="loading" Body={<div>Loading form...</div>} />;
  }

  if (error && !formInitialized) {
    return <ProductLayout productype="error" Body={<div>Error: {error} <button onClick={() => { localStorage.removeItem('productFormData'); window.location.reload(); }}>Clear Cache & Try again</button></div>} />;
  }

  // Render the appropriate page based on pageNo
  const renderPage = () => {
    switch (pageNo) {
      case 0:
        return <ProductInformation setPageNo={setPageNo} updateProductData={updateProductData} productData={productData} />;
      case 1:
        return <Media setPageNo={setPageNo} updateProductData={updateProductData} productData={productData} />;
      case 2:
        return <Price setPageNo={setPageNo} updateProductData={updateProductData} productData={productData} />;
      case 3:
        return <Tags setPageNo={setPageNo} updateProductData={updateProductData} productData={productData} onSubmit={handleProductSubmit} />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (

    <>
      <div className="relative w-full my-16">
        <ProgressBar
          className="absolute left-1/2 -translate-y-1/2 -translate-x-1/2 top-0 z-20"
          step1="Product Info"
          step2="Media"
          step3="Pricing"
          step4="Tags"
          currentStep={pageNo}
        />
        <div className="your-content-class">
          {/* Your main content here */}
          {renderPage()}
        </div>
      </div>
      <button onClick={resetForm} title="Reset Form Data" className="fixed bottom-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center">
        <Trash size={18} />
        <span className="ml-2 text-sm">Reset Form</span>
      </button>
    </>

  );
};
