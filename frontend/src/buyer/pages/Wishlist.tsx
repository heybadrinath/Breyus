import React from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Navbar from '../components/navbar';
import { Product } from '../../services/products.service';
import { useNavigate } from 'react-router-dom';

interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
}

const Wishlist: React.FC = () => {

    const navigate = useNavigate();

  const wishlistItems: WishlistItem[] = [
    {
      id: '1',
      productId: '101',
      product: {
        id: '101',
        name: 'Product 1',
        description: 'desc',
        detailedDescription: 'details',
        category: 'cat',
        hsnCode: '1234',
        price: 20,
        currency: 'USD',
        sku: 'SKU101',
        onSale: false,
        discount: 0,
        salePrice: 20,
        costOfGoods: 10,
        profit: 10,
        margin: 50,
        tags: [],
        stock: 10,
        stockUnit: 'pcs',
        productImage: '',
        images: [],
        primaryImage: '',
        testReport: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        moq: 1,
        moqUnit: 'pcs',
        preciseDescription: '',
        sellerName: 'Seller',
        companyName: 'Company',
        revenueMin: '',
        revenueMax: '',
        currencyTrade: '',
        unitTrade: '',
        yearsTrade: '',
        industry: '',
        marketYears: '',
        sellerMarketYears: '',
        marketcapture: '',
        selectedIncoterm: 'EXW',
        selectedIncotermData: {},
        defaults: {} as any,
      },
    },
    {
        id: '1',
        productId: '101',
        product: {
          id: '101',
          name: 'Product 1',
          description: 'desc',
          detailedDescription: 'details',
          category: 'cat',
          hsnCode: '1234',
          price: 20,
          currency: 'USD',
          sku: 'SKU101',
          onSale: false,
          discount: 0,
          salePrice: 20,
          costOfGoods: 10,
          profit: 10,
          margin: 50,
          tags: [],
          stock: 10,
          stockUnit: 'pcs',
          productImage: '',
          images: [],
          primaryImage: '',
          testReport: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          moq: 1,
          moqUnit: 'pcs',
          preciseDescription: '',
          sellerName: 'Seller',
          companyName: 'Company',
          revenueMin: '',
          revenueMax: '',
          currencyTrade: '',
          unitTrade: '',
          yearsTrade: '',
          industry: '',
          marketYears: '',
          sellerMarketYears: '',
          marketcapture: '',
          selectedIncoterm: 'EXW',
          selectedIncotermData: {},
          defaults: {} as any,
        }
    },
    
  ];

  const handleRemoveFromWishlist = (productId: string): void => {
    // Logic to remove from wishlist (optional)
    console.log(`Remove product with id: ${productId}`);
  };

  const handleClearWishlist = (): void => {
    // Logic to clear wishlist (optional)
    console.log('Clear all items');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-screen">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 overflow-y-auto">
        {/* Fixed Navbar */}
        <div className="fixed top-0 right-0 left-64 z-10 p-6">
          <Navbar />
        </div>

        {/* Wishlist Content */}
        <div className="p-6 mt-28">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Wishlist</h1>
             
            </div>
            
          </div>

          {wishlistItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-gray-400 text-6xl mb-4">💝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Wishlist is Empty</h3>
              <p className="text-gray-600 mb-4">
                Save items you love for later by clicking the heart icon on any product.
              </p>
              <button
                onClick={() => navigate('/buyer/homepage')}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-6">
              {wishlistItems.map((item) => (
                <div key={item.id} className="relative">
                  <ProductCard
                    product={item.product}
                    onClick={() => window.location.href = `/buyer/product-page?id=${item.productId}`}
                  />
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
