import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProductRow } from "../components/productRowInventory";
import { getUserProducts } from "../../services/products.service";

export const Inventory: React.FC = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState<any[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [inStockProducts, setInStockProducts] = useState(0);
    const [lowStockProducts, setLowStockProducts] = useState(0);
    const [outOfStockProducts, setOutOfStockProducts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await getUserProducts();
                const data = response.data || [];
                setProducts(data);
                setTotalProducts(data.length);
                // Calculate stock stats
                let inStock = 0, lowStock = 0, outOfStock = 0;
                data.forEach((product: any) => {
                    const stock = parseFloat(product.stock);
                    if (stock > 10) inStock++;
                    else if (stock > 0) lowStock++;
                    else outOfStock++;
                });
                setInStockProducts(inStock);
                setLowStockProducts(lowStock);
                setOutOfStockProducts(outOfStock);
            } catch (err: any) {
                setError(err.message || "Failed to fetch products");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
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
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="">All Categories</option>
                                <option value="Oils">Oils</option>
                                <option value="dummy-1">Category 1</option>
                                <option value="dummy-2">Category 2</option>
                            </select>
                            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="">All Stock Status</option>
                                <option value="in-stock">In Stock</option>
                                <option value="low-stock">Low Stock</option>
                                <option value="out-of-stock">Out of Stock</option>
                            </select>
                            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="name-asc">Name A-Z</option>
                                <option value="name-desc">Name Z-A</option>
                                <option value="price-asc">Price Low-High</option>
                                <option value="price-desc">Price High-Low</option>
                                <option value="quantity-asc">Stock Low-High</option>
                                <option value="quantity-desc">Stock High-Low</option>
                            </select>
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

                {/* Products Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                                    {products.map((product: any) => {
                                        // Determine status
                                        let status = "";
                                        const stock = parseFloat(product.stock);
                                        if (stock > 10) status = "In Stock";
                                        else if (stock > 0) status = "Low Stock";
                                        else status = "Out of Stock";
                                        return (
                                            <ProductRow
                                                key={product._id || product.id}
                                                imageUrl={product.productImages && product.productImages.length > 0 ? process.env.REACT_APP_BACKEND_URL + '/' +product.productImages[0] : undefined}
                                                productName={product.name}
                                                productDescription={product.description}
                                                hsn={product.hsnCode}
                                                stock={product.stock}
                                                stockUnit={product.stockUnit}
                                                moq={product.moq}
                                                moqUnit={product.moqUnit}
                                                price={product.price}
                                                onSalePrice={product.salePrice}
                                                currency={product.currency}
                                                category={product.category}
                                                status={status}
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
                                Showing 1 to 5 of {totalProducts} products
                            </div>
                            <select className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value={5}>5 per page</option>
                                <option value={10}>10 per page</option>
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                <button className="px-3 py-2 border text-sm font-medium rounded-md border-blue-500 bg-blue-50 text-blue-600">
                                    1
                                </button>
                                <button className="px-3 py-2 border text-sm font-medium rounded-md border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                                    2
                                </button>
                                <button className="px-3 py-2 border text-sm font-medium rounded-md border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                                    3
                                </button>
                                <button className="px-3 py-2 border text-sm font-medium rounded-md border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                                    4
                                </button>
                                <button className="px-3 py-2 border text-sm font-medium rounded-md border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                                    5
                                </button>
                            </div>
                            <button
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal (Hidden by default in static version) */}
            {/*   
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
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
        >
          Delete Product
        </button>
      </div>
    </div>
  </div>
  */}
        </div>
    );
};

