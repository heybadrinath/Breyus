import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ProductRow } from "../components/productRowInventory";
import SelectField from "../../components/SelectField";
import { SearchHeaderLight } from "../../components/Header";
import { deleteProduct, getUserProductsWithPagination, updateProductVisibility } from "../../services/products.service";

export const Inventory: React.FC = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState<any[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [inStockProducts, setInStockProducts] = useState(0);
    const [lowStockProducts, setLowStockProducts] = useState(0);
    const [outOfStockProducts, setOutOfStockProducts] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [stockStatusFilter, setStockStatusFilter] = useState('');
    const [sortOption, setSortOption] = useState('name-asc');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [previewProduct, setPreviewProduct] = useState<any | null>(null);
    const [previewTab, setPreviewTab] = useState<'overview' | 'pricing' | 'terms' | 'incoterms' | 'media'>('overview');
    const [productToDelete, setProductToDelete] = useState<any | null>(null);
    const [visibilityLoadingId, setVisibilityLoadingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'mainstream' | 'niche'>('all');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            // Determine isMainstream filter based on active tab
            const isMainstreamFilter = activeTab === 'all' ? undefined : activeTab === 'mainstream';

            const response = await getUserProductsWithPagination({
                page,
                limit: pageSize,
                search: searchQuery || undefined,
                category: categoryFilter || undefined,
                stockStatus: stockStatusFilter || undefined,
                sort: sortOption || undefined,
                isMainstream: isMainstreamFilter,
            });
            const data = response.data || [];
            setProducts(data);
            setTotalProducts(response.stats?.totalProducts ?? response.pagination?.totalProducts ?? data.length);
            setTotalPages(response.pagination?.totalPages ?? 0);
            setInStockProducts(response.stats?.inStockProducts ?? 0);
            setLowStockProducts(response.stats?.lowStockProducts ?? 0);
            setOutOfStockProducts(response.stats?.outOfStockProducts ?? 0);
        } catch (err: any) {
            setError(err.message || "Failed to fetch products");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchQuery, categoryFilter, stockStatusFilter, sortOption, activeTab]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, categoryFilter, stockStatusFilter, sortOption, activeTab]);

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        setActionLoading(true);
        setActionError('');
        try {
            const productId = productToDelete._id || productToDelete.id;
            await deleteProduct(productId);
            setProductToDelete(null);
            if (products.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                fetchProducts();
            }
        } catch (err: any) {
            setActionError(err.message || 'Failed to delete product');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleVisibility = async (product: any, nextActive: boolean) => {
        const productId = product._id || product.id;
        if (!productId) return;
        setVisibilityLoadingId(productId);
        setActionError('');
        try {
            const response = await updateProductVisibility(productId, nextActive);
            const updated = response.data || {};
            setProducts((prev) => prev.map((item) => {
                const itemId = item._id || item.id;
                if (itemId !== productId) return item;
                return {
                    ...item,
                    isActive: updated.isActive ?? nextActive,
                };
            }));
        } catch (err: any) {
            setActionError(err.message || 'Failed to update product visibility');
        } finally {
            setVisibilityLoadingId(null);
        }
    };

    const showingStart = totalProducts === 0 ? 0 : (page - 1) * pageSize + 1;   
    const showingEnd = Math.min(page * pageSize, totalProducts);
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
    const formatValue = (value: any) => (value === null || value === undefined || value === '' ? 'N/A' : value);
    const formatDate = (value: any) => {
        if (!value) return 'N/A';
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
    };
    const formatRange = (min: any, max: any, currency?: any, unit?: any) => {
        const hasValues = [min, max, currency, unit].some((value) => value !== null && value !== undefined && value !== '');
        if (!hasValues) return 'N/A';
        const range = `${formatValue(min)} to ${formatValue(max)}`;
        const suffix = [currency, unit].filter((value) => value !== null && value !== undefined && value !== '').join(' ');
        return suffix ? `${range} ${suffix}` : range;
    };
    const previewImages = previewProduct && Array.isArray(previewProduct.productImages)
        ? previewProduct.productImages
        : previewProduct && Array.isArray(previewProduct.images)
            ? previewProduct.images
            : [];
    const previewReports = previewProduct && Array.isArray(previewProduct.testReports)
        ? previewProduct.testReports
        : previewProduct && previewProduct.testReport
            ? [previewProduct.testReport]
            : [];
    const previewMainImage = previewProduct
        ? previewImages[0] || previewProduct.primaryImage || previewProduct.productImage
        : '';
    const incotermRows = [
        'Charges/Fees',
        'Transfer of risk',
        'Commercial Invoice',
        'Packaging, Quality Control, Marking',
        'Loading & Inland Delivery',
        'Export Duty & Taxes',
        'Origin Terminal Handling',
        'Insurance',
        'Carriage Charges',
        '*Destination Terminal Handling',
        'Delivery to Destination',
        'Unloading at Destination',
        'Import Duty & Taxes'
    ];
    const incotermPreviewDefaults: Record<string, Record<string, string>> = {
        EXW: {
            'Charges/Fees': 'Ex Works',
            'Transfer of risk': "when seller places the goods at the buyer's disposal at a namedplace",
            'Commercial Invoice': 'Seller',
            'Packaging, Quality Control, Marking': 'Seller',
            'Loading & Inland Delivery': 'Buyer',
            'Export Duty & Taxes': 'Buyer',
            'Origin Terminal Handling': 'Buyer',
            'Insurance': 'Buyer',
            'Carriage Charges': 'Buyer',
            '*Destination Terminal Handling': 'Buyer',
            'Delivery to Destination': 'Buyer',
            'Unloading at Destination': 'Buyer',
            'Import Duty & Taxes': 'Buyer',
        },
        FCA: {
            'Charges/Fees': 'Free Carrier',
            'Transfer of risk': "1) When seller loads goods to the buyer's carrier 2) When goods are at the buyer's disposal & ready for unloading at a named place",
            'Commercial Invoice': 'Seller',
            'Packaging, Quality Control, Marking': 'Seller',
            'Loading & Inland Delivery': 'Seller',
            'Export Duty & Taxes': 'Seller',
            'Origin Terminal Handling': 'Buyer',
            'Insurance': 'Buyer',
            'Carriage Charges': 'Buyer',
            '*Destination Terminal Handling': 'Buyer',
            'Delivery to Destination': 'Buyer',
            'Unloading at Destination': 'Buyer',
            'Import Duty & Taxes': 'Buyer',
        },
        FAS: {
            'Charges/Fees': 'Free Alongside Ship',
            'Transfer of risk': "when the goods are handed over to the seller's nominated carrier at a named place",
            'Commercial Invoice': 'Seller',
            'Packaging, Quality Control, Marking': 'Seller',
            'Loading & Inland Delivery': 'Seller',
            'Export Duty & Taxes': 'Seller',
            'Origin Terminal Handling': 'Buyer',
            'Insurance': 'Buyer',
            'Carriage Charges': 'Buyer',
            '*Destination Terminal Handling': 'Buyer',
            'Delivery to Destination': 'Buyer',
            'Unloading at Destination': 'Buyer',
            'Import Duty & Taxes': 'Buyer',
        },
        FOB: {
            'Charges/Fees': 'Free On Board',
            'Transfer of risk': 'when goods are alongside the vessel nominated by the buyer at named port',
            'Commercial Invoice': 'Seller',
            'Packaging, Quality Control, Marking': 'Seller',
            'Loading & Inland Delivery': 'Seller',
            'Export Duty & Taxes': 'Seller',
            'Origin Terminal Handling': 'Seller',
            'Insurance': 'Buyer',
            'Carriage Charges': 'Buyer',
            '*Destination Terminal Handling': 'Buyer',
            'Delivery to Destination': 'Buyer',
            'Unloading at Destination': 'Buyer',
            'Import Duty & Taxes': 'Buyer',
        },
        CFR: {
            'Charges/Fees': 'Cost & Freight',
            'Transfer of risk': 'when goods are on board the vessel nominated by the seller at named port',
            'Commercial Invoice': 'Seller',
            'Packaging, Quality Control, Marking': 'Seller',
            'Loading & Inland Delivery': 'Seller',
            'Export Duty & Taxes': 'Seller',
            'Origin Terminal Handling': 'Seller',
            'Insurance': 'Buyer',
            'Carriage Charges': 'Seller',
            '*Destination Terminal Handling': 'Buyer',
            'Delivery to Destination': 'Buyer',
            'Unloading at Destination': 'Buyer',
            'Import Duty & Taxes': 'Buyer',
        },
        CIF: {
            'Charges/Fees': 'Cost Insurance & Freight',
            'Transfer of risk': 'when the goods are on board the vessel nominated by the seller at origin',
            'Commercial Invoice': 'Seller',
            'Packaging, Quality Control, Marking': 'Seller',
            'Loading & Inland Delivery': 'Seller',
            'Export Duty & Taxes': 'Seller',
            'Origin Terminal Handling': 'Seller',
            'Insurance': 'Buyer',
            'Carriage Charges': 'Seller',
            '*Destination Terminal Handling': 'Buyer',
            'Delivery to Destination': 'Buyer',
            'Unloading at Destination': 'Buyer',
            'Import Duty & Taxes': 'Buyer',
        },
        CPT: {
            'Charges/Fees': 'Carriage Paid To',
            'Transfer of risk': "when the goods are handed over to the seller's nominated carrier at a named place",
            'Commercial Invoice': 'Seller',
            'Packaging, Quality Control, Marking': 'Seller',
            'Loading & Inland Delivery': 'Seller',
            'Export Duty & Taxes': 'Seller',
            'Origin Terminal Handling': 'Seller',
            'Insurance': 'Seller \"All Risk\"',
            'Carriage Charges': 'Seller',
            '*Destination Terminal Handling': 'Buyer',
            'Delivery to Destination': 'Buyer',
            'Unloading at Destination': 'Buyer',
            'Import Duty & Taxes': 'Buyer',
        },
        CIP: {
            'Charges/Fees': 'Carriage Insurance Paid To',
            'Transfer of risk': "when the goods are handed over to the seller's nominated carrier at a named place",
            'Commercial Invoice': 'Seller',
            'Packaging, Quality Control, Marking': 'Seller',
            'Loading & Inland Delivery': 'Seller',
            'Export Duty & Taxes': 'Seller',
            'Origin Terminal Handling': 'Seller',
            'Insurance': 'Buyer',
            'Carriage Charges': 'Seller',
            '*Destination Terminal Handling': 'Buyer',
            'Delivery to Destination': 'Buyer',
            'Unloading at Destination': 'Buyer',
            'Import Duty & Taxes': 'Buyer',
        },
        DAP: {
            'Charges/Fees': 'Delivered at Place',
            'Transfer of risk': "when the goods are placed at the buyer's disposal at a named place or agreed point within that place",
            'Commercial Invoice': 'Seller',
            'Packaging, Quality Control, Marking': 'Seller',
            'Loading & Inland Delivery': 'Seller',
            'Export Duty & Taxes': 'Seller',
            'Origin Terminal Handling': 'Seller',
            'Insurance': 'Buyer',
            'Carriage Charges': 'Seller',
            '*Destination Terminal Handling': 'Seller',
            'Delivery to Destination': 'Seller',
            'Unloading at Destination': 'Buyer',
            'Import Duty & Taxes': 'Buyer',
        },
        DPU: {
            'Charges/Fees': 'Delivered at Place Unloaded',
            'Transfer of risk': 'when the goods are delivered and unloaded at a named place or agreed point within that place',
            'Commercial Invoice': 'Seller',
            'Packaging, Quality Control, Marking': 'Seller',
            'Loading & Inland Delivery': 'Seller',
            'Export Duty & Taxes': 'Seller',
            'Origin Terminal Handling': 'Seller',
            'Insurance': 'Buyer',
            'Carriage Charges': 'Seller',
            '*Destination Terminal Handling': 'Seller',
            'Delivery to Destination': 'Seller',
            'Unloading at Destination': 'Seller',
            'Import Duty & Taxes': 'Buyer',
        },
        DDP: {
            'Charges/Fees': 'Delivered Duty Paid',
            'Transfer of risk': "when the goods are placed at the buyer's disposal at a named place or agreed point within that place",
            'Commercial Invoice': 'Seller',
            'Packaging, Quality Control, Marking': 'Seller',
            'Loading & Inland Delivery': 'Seller',
            'Export Duty & Taxes': 'Seller',
            'Origin Terminal Handling': 'Seller',
            'Insurance': 'Buyer',
            'Carriage Charges': 'Seller',
            '*Destination Terminal Handling': 'Seller',
            'Delivery to Destination': 'Seller',
            'Unloading at Destination': 'Buyer',
            'Import Duty & Taxes': 'Seller',
        },
    };
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const tabButtonClass = (tab: string) => (previewTab === tab
        ? 'bg-black text-white border border-black'
        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50');

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                <SearchHeaderLight />
            </div>
            <div className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex mb-4">
                        <div className="mb-4">
                            <h1 className="text-3xl font-bold text-gray-900">Product Inventory</h1>
                            <p className="text-gray-600 mt-1">
                                Manage your product listings and stock levels
                            </p>
                        </div>
                        <button onClick={() => navigate('/seller/add-products')} className="bg-black hover:bg-gray-800 text-white px-6 py-2 w-fit h-fit ml-auto my-auto font-medium transition-colors duration-200 rounded-lg">
                            New Product
                        </button>
                    </div>

                    {/* Commodity Type Tabs */}
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'all'
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            All Products
                        </button>
                        <button
                            onClick={() => setActiveTab('mainstream')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'mainstream'
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                Commodity Inventory
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('niche')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'niche'
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                Niche Commodity Inventory
                            </span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-blue-600 text-sm font-medium">Total Products</div>
                            <div className="text-2xl font-bold text-blue-900">{totalProducts}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-green-600 text-sm font-medium">In Stock</div>
                            <div className="text-2xl font-bold text-green-900">{inStockProducts}</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="text-yellow-600 text-sm font-medium">Low Stock</div>
                            <div className="text-2xl font-bold text-yellow-900">{lowStockProducts}</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <div className="text-red-600 text-sm font-medium">Out of Stock</div>
                            <div className="text-2xl font-bold text-red-900">{outOfStockProducts}</div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-4">
                        <div className="flex-1">
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <SelectField
                                value={categoryFilter}
                                onValueChange={(value) => setCategoryFilter(String(value))}
                            >
                                <option value="">All Categories</option>
                                <option value="Oils">Oils</option>
                                <option value="dummy-1">Category 1</option>
                                <option value="dummy-2">Category 2</option>
                            </SelectField>
                            <SelectField
                                value={stockStatusFilter}
                                onValueChange={(value) => setStockStatusFilter(String(value))}
                            >
                                <option value="">All Stock Status</option>
                                <option value="in-stock">In Stock</option>
                                <option value="low-stock">Low Stock</option>
                                <option value="out-of-stock">Out of Stock</option>
                            </SelectField>
                            <SelectField
                                value={sortOption}
                                onValueChange={(value) => setSortOption(String(value))}
                            >
                                <option value="name-asc">Name A-Z</option>
                                <option value="name-desc">Name Z-A</option>
                                <option value="price-asc">Price Low-High</option>
                                <option value="price-desc">Price High-Low</option>
                                <option value="quantity-asc">Stock Low-High</option>
                                <option value="quantity-desc">Stock High-Low</option>
                            </SelectField>
                        </div>
                    </div>

                    {/* Bulk Actions (Hidden by default in static version) */}
                    {/*       
      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg mb-4">
        <span className="text-blue-700 font-medium">
          X product(s) selected
        </span>
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors duration-200"
        >
          Delete Selected
        </button>
        <button
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear Selection
        </button>
      </div>
      */}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}
                {actionError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {actionError}
                    </div>
                )}

                {/* Products Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-visible">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                        <SelectField
                            value={pageSize}
                            className="select-field--sm"
                            onValueChange={(value) => {
                                const nextSize = parseInt(String(value), 10);
                                setPageSize(nextSize);
                                setPage(1);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </SelectField>
                        <span className="text-sm text-gray-600">entries per page</span>
                    </div>
                    {loading ? (
                        <div className="text-center py-16 text-gray-500">Loading...</div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-gray-400 text-6xl mb-4">📦</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
                            <p className="text-gray-600 mb-6">
                                You haven't added any products yet. Start by adding your first product!
                            </p>
                            <a
                                href='/seller/add-products?new=true'
                                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-none font-medium transition-colors duration-200 inline-block"
                            >
                                New Product
                            </a>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                            Product Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                            Price/Unit
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                            Unit
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                            MOQ
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                            SKU
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((product: any) => {
                                        // Determine status
                                        let status = "";
                                        const stock = parseFloat(product.stock);
                                        if (stock > 0) status = "In Stock";
                                        else status = "Out of Stock";
                                        return (
                                            <ProductRow
                                                key={product._id || product.id}
                                                imageUrl={product.productImages && product.productImages.length > 0 ? process.env.REACT_APP_BACKEND_URL + '/' + product.productImages[0] : undefined}
                                                productName={product.name}
                                                hsn={product.hsnCode}
                                                quantity={product.stock}
                                                unit={product.stockUnit}
                                                moq={product.moq}
                                                moqUnit={product.moqUnit}
                                                sku={product.sku}
                                                price={product.price}
                                                onSalePrice={product.salePrice}
                                                currency={product.currency}
                                                category={product.category}
                                                status={status}
                                                isActive={product.isActive !== false}
                                                isUpdatingActive={visibilityLoadingId === (product._id || product.id)}
                                                onEyeClick={() => {
                                                    setPreviewTab('overview');
                                                    setPreviewProduct(product);
                                                }}
                                                onEditClick={() => navigate(`/seller/add-products?productId=${product._id || product.id}`)}
                                                onDeleteClick={() => setProductToDelete(product)}
                                                onToggleActive={(nextActive) => handleToggleVisibility(product, nextActive)}
                                            />
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* Pagination */}
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-700">
                                Showing {showingStart} to {showingEnd} of {totalProducts} products
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page <= 1}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {pageNumbers.map((pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        className={`px-3 py-2 border text-sm font-medium rounded-md ${pageNumber === page ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                                        onClick={() => setPage(pageNumber)}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}
                            </div>
                            <button
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={page >= totalPages || totalPages === 0}
                                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            </div>
            {previewProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-5xl w-full shadow-xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
                        <div className="flex items-center justify-between border-b px-6 py-3 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
                                <p className="text-xs text-gray-500">Full product profile</p>
                            </div>
                            <button
                                className="text-gray-400 hover:text-gray-600"
                                onClick={() => setPreviewProduct(null)}
                                aria-label="Close product preview"
                            >
                                x
                            </button>
                        </div>

                        <div className="px-6 py-3">
                            <div className="grid gap-4 lg:grid-cols-[200px,1fr]">
                                <div className="w-full space-y-2">
                                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border">
                                        <img
                                            className="w-full h-full object-cover"
                                            src={previewMainImage ? `${backendUrl}/${previewMainImage}` : '/placeholder-product.svg'}
                                            alt={previewProduct.name}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                                        <div>
                                            <div className="text-gray-400 uppercase tracking-wide">Created</div>
                                            <div className="font-semibold text-gray-800">{formatDate(previewProduct.createdAt)}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 uppercase tracking-wide">Updated</div>
                                            <div className="font-semibold text-gray-800">{formatDate(previewProduct.updatedAt)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3 min-w-0">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-xl font-semibold text-gray-900">{previewProduct.name}</h4>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
                                                {previewProduct.category || 'Uncategorized'}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${parseFloat(previewProduct.stock || '0') > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {parseFloat(previewProduct.stock || '0') > 0 ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${previewProduct.isActive !== false ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {previewProduct.isActive !== false ? 'Visible to buyers' : 'Hidden from buyers'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {previewProduct.description || 'No short description added.'}
                                        </p>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                            <div className="text-[11px] uppercase tracking-wide text-gray-400">SKU</div>
                                            <div className="text-sm font-semibold text-gray-900">{formatValue(previewProduct.sku)}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                            <div className="text-[11px] uppercase tracking-wide text-gray-400">HSN Code</div>
                                            <div className="text-sm font-semibold text-gray-900">{formatValue(previewProduct.hsnCode)}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                            <div className="text-[11px] uppercase tracking-wide text-gray-400">Price</div>
                                            <div className="text-sm font-semibold text-gray-900">{formatValue(previewProduct.price)} {formatValue(previewProduct.currency)}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                            <div className="text-[11px] uppercase tracking-wide text-gray-400">MOQ</div>
                                            <div className="text-sm font-semibold text-gray-900">{formatValue(previewProduct.moq)} {formatValue(previewProduct.moqUnit)}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                            <div className="text-[11px] uppercase tracking-wide text-gray-400">Stock</div>
                                            <div className="text-sm font-semibold text-gray-900">{formatValue(previewProduct.stock)} {formatValue(previewProduct.stockUnit)}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                            <div className="text-[11px] uppercase tracking-wide text-gray-400">On Sale</div>
                                            <div className="text-sm font-semibold text-gray-900">{previewProduct.onSale ? 'Yes' : 'No'}</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[11px] uppercase tracking-wide text-gray-400">Tags</span>
                                        <div className="flex flex-wrap gap-2">
                                            {previewProduct.tags && previewProduct.tags.length > 0 ? (
                                                previewProduct.tags.map((tag: string) => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500">No tags added</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-b px-6 flex-shrink-0">
                            <div className="flex flex-wrap gap-2 py-2">
                                <button
                                    type="button"
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${tabButtonClass('overview')}`}
                                    onClick={() => setPreviewTab('overview')}
                                >
                                    Overview
                                </button>
                                <button
                                    type="button"
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${tabButtonClass('pricing')}`}
                                    onClick={() => setPreviewTab('pricing')}
                                >
                                    Pricing & Stock
                                </button>
                                <button
                                    type="button"
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${tabButtonClass('terms')}`}
                                    onClick={() => setPreviewTab('terms')}
                                >
                                    Preferred Terms
                                </button>
                                <button
                                    type="button"
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${tabButtonClass('incoterms')}`}
                                    onClick={() => setPreviewTab('incoterms')}
                                >
                                    Incoterms
                                </button>
                                <button
                                    type="button"
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${tabButtonClass('media')}`}
                                    onClick={() => setPreviewTab('media')}
                                >
                                    Media & Docs
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-3 flex-1 overflow-y-auto min-h-0">
                            {previewTab === 'overview' && (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900">Descriptions</h4>
                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 leading-relaxed max-h-32 overflow-hidden">
                                            {previewProduct.detailedDescription || previewProduct.description || 'No description available.'}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-400">Application</div>
                                            <div className="text-sm font-medium text-gray-900">{formatValue(previewProduct.application)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400">Environmental Impact</div>
                                            <div className="text-sm font-medium text-gray-900">{formatValue(previewProduct.environmentalImpact)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400">Quality Assurance</div>
                                            <div className="text-sm font-medium text-gray-900">{formatValue(previewProduct.qualityAssurance)}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewTab === 'pricing' && (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900">Pricing</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-xs text-gray-400">Base Price</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.price)} {formatValue(previewProduct.currency)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">On Sale</div>
                                                <div className="font-medium text-gray-900">{previewProduct.onSale ? 'Yes' : 'No'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Discount</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.discount)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Sale Price</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.salePrice)} {formatValue(previewProduct.currency)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Cost of Goods</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.costOfGoods)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Profit</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.profit)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Margin</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.margin)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Effective Price</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.pricing)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900">Inventory</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-xs text-gray-400">Stock</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.stock)} {formatValue(previewProduct.stockUnit)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">MOQ</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.moq)} {formatValue(previewProduct.moqUnit)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Status</div>
                                                <div className="font-medium text-gray-900">{parseFloat(previewProduct.stock || '0') > 0 ? 'In Stock' : 'Out of Stock'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Visibility</div>
                                                <div className="font-medium text-gray-900">{previewProduct.isActive !== false ? 'Visible to buyers' : 'Hidden from buyers'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewTab === 'terms' && (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900">Trade Requirements</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-xs text-gray-400">Export Location</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.exportLocation)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Nearest Port</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.nearestPort)}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="text-xs text-gray-400">Buyer Revenue Range</div>
                                                <div className="font-medium text-gray-900">
                                                    {formatRange(previewProduct.revenueMin, previewProduct.revenueMax, previewProduct.currencyTrade, previewProduct.unitTrade)}
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="text-xs text-gray-400">Payment, Bank & Insurance</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.paymentTerms)}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="text-xs text-gray-400">Delivery & Logistics</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.logisticsTerms)}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="text-xs text-gray-400">POP Terms</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.popTerms)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900">Market Details</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-xs text-gray-400">Years to Trade</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.yearsTrade)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Industry</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.industry)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Market Years</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.marketYears)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Buyer Market Years</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.sellerMarketYears)}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="text-xs text-gray-400">Market Capture</div>
                                                <div className="font-medium text-gray-900">{formatValue(previewProduct.marketcapture)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewTab === 'incoterms' && (
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-gray-200 p-3">
                                        <div className="text-xs text-gray-400">Selected Incoterm</div>
                                        <div className="text-lg font-semibold text-gray-900">{formatValue(previewProduct.selectedIncoterm)}</div>
                                    </div>
                                    <div className="grid gap-2 lg:grid-cols-2">
                                        {incotermRows.map((rowName) => {
                                            const selectedTerm = previewProduct.selectedIncoterm;
                                            const defaultMap = selectedTerm ? previewProduct.defaults?.[selectedTerm] : undefined;
                                            const fallbackMap = selectedTerm ? incotermPreviewDefaults[selectedTerm] : undefined;
                                            const value =
                                                previewProduct.selectedIncotermData?.[rowName] ||
                                                defaultMap?.[rowName] ||
                                                fallbackMap?.[rowName] ||
                                                'N/A';
                                            return (
                                                <div key={rowName} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-1.5 text-xs">
                                                    <span className="text-gray-600">{rowName}</span>
                                                    <span className="font-medium text-gray-900">{value}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {previewTab === 'media' && (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900">Product Images</h4>
                                        {previewImages.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {previewImages.map((image: string) => (
                                                    <div key={image} className="aspect-square rounded-lg overflow-hidden border bg-gray-100">
                                                        <img
                                                            className="w-full h-full object-cover"
                                                            src={`${backendUrl}/${image}`}
                                                            alt={previewProduct.name}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500">No product images uploaded.</div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900">Test Reports</h4>
                                        {previewReports.length > 0 ? (
                                            <div className="space-y-2">
                                                {previewReports.map((report: string) => {
                                                    const fileName = report.split('/').pop();
                                                    return (
                                                        <a
                                                            key={report}
                                                            href={`${backendUrl}/${report}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                        >
                                                            <span>{fileName || 'Report'}</span>
                                                            <span className="text-xs text-gray-400">View</span>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500">No test reports uploaded.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-3 flex-shrink-0">
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                onClick={() => setPreviewProduct(null)}
                            >
                                Close
                            </button>
                            <button
                                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800"
                                onClick={() => {
                                    setPreviewProduct(null);
                                    navigate(`/seller/add-products?productId=${previewProduct._id || previewProduct.id}`);
                                }}
                            >
                                Edit Product
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {productToDelete && (
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
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                onClick={() => setProductToDelete(null)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md disabled:opacity-50"
                                onClick={handleDeleteProduct}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Deleting...' : 'Delete Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

