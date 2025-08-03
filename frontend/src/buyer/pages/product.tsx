import React, { useState, useEffect } from "react";
import { Heart, Share2, MessageCircle, Package, Shield, Truck, X, Copy, Repeat, FlaskConical } from "lucide-react";
import { getProductById, Product } from "../../services/products.service";
import TestReport from "../../buyer/components/webUrlframe";
import { Incoterms } from "../../components/incoterms";
import { createConversation } from "../../services/inbox.service";
import { useNavigate } from "react-router-dom";
import { addToWishlist, removeFromWishlist, getWishlist } from '../../services/wishlist.service';
import { TryBreyusCoreHeader } from "../../components/Header";

// import social media icons
import fb from "../assets/social-icons/fb.svg";
import ln from "../assets/social-icons/ln.svg";
import whatsapp from "../assets/social-icons/whatsapp.svg";
import x_twitter from "../assets/social-icons/x.svg";




const ProductPage: React.FC = () => {

  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [tradeRequestSent, setTradeRequestSent] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [showTestReport, setShowTestReport] = useState(false);

  const [showTradeTerms, setShowTradeTerms] = useState(false);



  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    let ignore = false;
    const checkWishlist = async () => {
      if (!product) return;
      try {
        const wishlist = await getWishlist();
        if (ignore) return;
        setIsWishlisted(wishlist.some((item: any) => item.id === product.id));
      } catch (e) {
        // ignore error
      }
    };
    checkWishlist();
    return () => { ignore = true; };
  }, [product]);

  // incoterms state 
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
    selectedIncoterm: "",
    selectedIncotermData: {},
    defaults: defaultIncotermValues
  });

  useEffect(() => {
    if (product) {
      setIncotermsState({
        selectedIncoterm: product.selectedIncoterm || "",
        selectedIncotermData: product.selectedIncotermData || {},
        defaults: product.defaults || defaultIncotermValues
      });
    }
  }, [product]);

  const [showIncoterms, setShowIncoterms] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get product ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
          setError('Product ID not found in URL');
          return;
        }


        const response = await getProductById(productId);

        if (response.statusCode === 200 && response.data) {
          // Transform backend data to match frontend Product interface
          const transformedProduct: Product = {
            id: response.data._id,
            name: response.data.name,
            description: response.data.description,
            detailedDescription: response.data.detailedDescription,
            category: response.data.category,
            hsnCode: response.data.hsnCode,
            price: parseFloat(response.data.price) || 0,
            currency: response.data.currency,
            sku: response.data.sku,
            onSale: response.data.onSale || false,
            discount: parseFloat(response.data.discount) || 0,
            salePrice: parseFloat(response.data.salePrice) || 0,
            costOfGoods: parseFloat(response.data.costOfGoods) || 0,
            profit: parseFloat(response.data.profit) || 0,
            margin: parseFloat(response.data.margin) || 0,
            tags: response.data.tags || [],
            stock: parseInt(response.data.stock) || 0,
            stockUnit: response.data.stockUnit,
            // Fix image URLs by adding backend URL prefix
            productImage: response.data.productImages?.[0] ? `${process.env.REACT_APP_BACKEND_URL}/${response.data.productImages[0]}` : '',
            images: response.data.productImages ? response.data.productImages.map((img: string) => `${process.env.REACT_APP_BACKEND_URL}/${img}`) : [],
            primaryImage: response.data.productImages?.[0] ? `${process.env.REACT_APP_BACKEND_URL}/${response.data.productImages[0]}` : '',
            testReport: response.data.testReports?.[0] ? `${process.env.REACT_APP_BACKEND_URL}/${response.data.testReports[0]}` : '',
            createdAt: new Date(response.data.createdAt),
            updatedAt: new Date(response.data.updatedAt),
            moq: response.data.moq,
            moqUnit: response.data.moqUnit,
            preciseDescription: response.data.description,
            sellerName: response.data.sellerName || 'Unknown Seller',
            companyName: response.data.companyName || 'Unknown Company',
            // trade terms
            revenueMin: response.data.revenueMin,
            revenueMax: response.data.revenueMax,
            currencyTrade: response.data.currencyTrade,
            unitTrade: response.data.unitTrade,
            yearsTrade: response.data.yearsTrade,
            industry: response.data.industry,
            marketYears: response.data.marketYears,
            sellerMarketYears: response.data.sellerMarketYears,
            marketcapture: response.data.marketcapture,
            selectedIncoterm: response.data.selectedIncoterm,
            selectedIncotermData: response.data.selectedIncotermData,
            defaults: response.data.defaults
          };





          setProduct(transformedProduct);
        } else {
          setError(response.message || 'Failed to load product');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, []);

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  };






  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Product</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/buyer/homepage')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h3>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => window.location.href = '/buyer/homepage'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.productImage || '/placeholder-product.svg'];

  const handleQuantityValidation = () => {
    if (Number(quantity) < product.moq) {
      setNotification({ type: 'error', message: `Minimum order quantity is ${product.moq} ${product.moqUnit}` });
      return;
    }
    if (Number(quantity) > product.stock) {
      setNotification({ type: 'error', message: `Only ${product.stock} ${product.stockUnit} available in stock.` });
      return;
    }
    navigate(`/buyer/purchase-request?id=${product.id}&quantity=${quantity}&quantity_unit=${product.moqUnit}`);
  }

  return (
    <>
      <TryBreyusCoreHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
              {/* Left: Product Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={images[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-product.svg';
                    }}
                  />
                </div>

                {/* Thumbnail Images */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className={`flex-shrink-0 w-20 h-20 bg-gray-100 rounded cursor-pointer border-2 ${selectedImageIndex === index ? 'border-blue-500' : 'border-transparent'
                          }`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-contain rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-product.svg';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Product Details */}
              <div className="space-y-6">
                {/* Product Title */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  <p className="text-gray-600">by {product.companyName || product.sellerName || 'Unknown Company'}</p>
                </div>


                {/* Price */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900">{(product.salePrice) ? product.salePrice.toLocaleString() + ' ' + product.currency : product.price.toLocaleString() + ' ' + product.currency}</span>
                    {product.onSale && (
                      <>
                        <span className="text-xl text-gray-500 line-through">{product.price.toLocaleString() + ' ' + product.currency}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                          {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* moq and stock  */}
                  <div className="flex">
                    {product.moq && (
                      <p className="text-sm text-gray-600">Minimum Order Quantity: {product.moq.toString() + ' ' + product.moqUnit}</p>
                    )}
                    <span className="text-sm text-gray-500 ml-auto">
                      Stock: {product.stock > 0 ? `${product.stock + ' ' + product.stockUnit} available` : 'Out of stock'}
                    </span>
                  </div>

                </div>



                {/* Description */}
                {product.preciseDescription && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-700">{product.preciseDescription}</p>
                  </div>
                )}


                {/* Quantity  and sample*/}
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <div className="flex gap-5">
                  <div>

                    <div className="form-field flex flex-row border-2 rounded-lg">
                      <input
                        type="number"
                        placeholder="Quantity"
                        className="w-full !border-0 !rounded-r-none"
                        value={quantity}
                        onChange={(event) => { setQuantity(event.target.value) }}
                        name="quantity"
                      />
                      <span className="my-auto mx-2">{product.moqUnit}</span>
                    </div>
                  </div>



                </div>

                {/* Action Buttons */}
                <div className="space-y-3">


                  <button className="w-full py-3 px-6 border border-gray-300 bg-black text-white rounded-lg font-semibold transition"
                    onClick={() => handleQuantityValidation()}
                  >
                    <Repeat className="inline pr-2 py-auto" /> Send Purchase Request
                  </button>


                  <button
                    className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-semibold transition"
                    onClick={() => { setShowTestReport(true) }}
                  >
                    <FlaskConical className="inline pr-2 py-auto text-black" />
                    View Test Reports
                  </button>
                  {/* View Trade Terms Button  and incoterms button*/}
                  <div className="flex gap-3">
                    <button
                      className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-semibold transition"
                      onClick={() => setShowTradeTerms(true)}
                    >
                      Preferred Trade Terms
                    </button>
                    <button
                      className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-semibold transition"
                      onClick={() => setShowIncoterms(true)}
                    >
                      Preferred Inco Terms
                    </button>
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!product || wishlistLoading) return;
                        setWishlistLoading(true);
                        try {
                          if (isWishlisted) {
                            await removeFromWishlist(product.id);
                            setIsWishlisted(false);
                          } else {
                            await addToWishlist(product.id);
                            setIsWishlisted(true);
                          }
                        } catch (err) {
                          // Optionally show error
                        } finally {
                          setWishlistLoading(false);
                        }
                      }}
                      className={`flex py-2 px-4 rounded-lg border transition-all  border-gray-300 text-gray-700 hover:bg-gray-50`}
                    >
                      <Heart className={` inline w-4 my-auto h-4 mr-2 ${isWishlisted ? 'fill-red-500 border-none' : ''}`} />
                      {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </button>

                    <button className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={async () => {
                        try {
                          const result = await createConversation(product.id);
                          if (result.status === 'success') {
                            // Use the returned conversation ID
                            const conversationId = result.data;
                            navigate(`/buyer/inbox?conversationId=${conversationId}`);
                          } else if (
                            result.message === 'Conversation already exists' && result.conversationId
                          ) {
                            // Navigate to inbox and select the existing conversation
                            navigate(`/buyer/inbox?conversationId=${result.conversationId}`);
                          } else if (
                            result.message === "You can't send a message to yourself" ||
                            (result.message && result.message.toLowerCase().includes('yourself'))
                          ) {
                            showNotification('error', "You can't send a message to yourself.");
                          } else {
                            showNotification('error', result.message || 'Failed to create conversation');
                          }
                        } catch (error) {
                          showNotification('error', 'Error creating conversation.');
                          console.error('Error creating conversation:', error);
                        }
                      }}
                    >
                      <MessageCircle className="inline w-4 h-4 mr-2" />
                      Ask Queries
                    </button>

                    <button onClick={() => setShowShare(true)} className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                      <Share2 className="inline w-4 h-4 mr-2" />
                      Share
                    </button>
                  </div>
                </div>

                {/* Product Features */}
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="w-4 h-4 text-green-600" />
                      Quality Assured
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Truck className="w-4 h-4 text-blue-600" />
                      Fast Delivery
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4 text-purple-600" />
                      Secure Packaging
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details Tabs */}
            {product.detailedDescription && (
              <div className="border-t bg-gray-50 p-6">
                <h3 className="text-xl font-semibold mb-4">Detailed Information</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{product.detailedDescription}</p>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          {notification && (
            <div className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg animate-bounce z-50 ${notification.type === 'success'
              ? 'bg-green-500 text-white'
              : notification.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
              }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && <span className="text-xl">✅</span>}
                  {notification.type === 'error' && <span className="text-xl">❌</span>}
                  {notification.type === 'info' && <span className="text-xl">ℹ️</span>}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{notification.message}</p>
                  {notification.type === 'success' && tradeRequestSent && (
                    <p className="text-xs mt-1 opacity-90">Redirecting to trade requests...</p>
                  )}
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-auto -mx-1.5 -my-1.5 text-white hover:bg-black hover:bg-opacity-20 rounded-lg p-1.5"
                >
                  <span className="text-sm">✕</span>
                </button>
              </div>
            </div>
          )}



          {/* Trade Terms Modal */}
          <TestReport onClose={() => setShowTestReport(false)} url={product.testReport} show={showTestReport} />



          {/* Trade Terms Modal */}
          {showTradeTerms && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in">
                <button
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowTradeTerms(false)}
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
                <h2 className="text-xl font-bold mb-4 text-center">Trade Terms</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold">Preferred Buyer Revenue Range:</span><br />
                    <span>{product.revenueMin + ' to ' + product.revenueMax + ' ' + product.currencyTrade + ' ' + product.unitTrade || "-"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Potential Years to Trade:</span><br />
                    <span>{product.yearsTrade || "-"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Industry Using Product:</span><br />
                    <span>{product.industry || "-"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Years in Market:</span><br />
                    <span>{product.marketYears || "-"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Buyer Market Duration:</span><br />
                    <span>{product.sellerMarketYears || "-"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Market Capture:</span><br />
                    <span>{product.marketcapture !== undefined && product.marketcapture !== null ? product.marketcapture + "%" : "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Incoterms model  */}
          {showIncoterms && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-xl w-[98vw] h-[96vh] mx-auto  p-6 relative animate-fade-in flex flex-col">
                <button
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowIncoterms(false)}
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
                <h2 className="text-xl font-bold mb-4 text-center">Preferred Inco Terms</h2>
                <div className="flex-1 overflow-y-auto">
                  <div>
                    <Incoterms incoterms={incotermsState} setIncoterms={() => { }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Share product model */}
          {showShare && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in">
                <button
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowShare(false)}
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
                <p className="text-xl f mb-4">Share link</p>
                <div>
                  <div className="text-sm border  rounded-lg flex px-3 py-2 overflow-x-auto bg-gray-200">
                    <div className=" w-full whitespace-nowrap text-gray-700 ">{window.location.href}</div>
                    <div onClick={() => { navigator.clipboard.writeText(window.location.href) }} className="right-6 absolute bg-gray-200 px-2 cursor-pointer"><Copy className="h-5 hover:scale-[1.05] hover:shadow-lg transition-all ease-in-out delay-300" /> </div>
                  </div>
                  <div className="mt-6 flex justify-evenly">
                    <img className="cursor-pointer" src={whatsapp} alt="Whatsapp" />
                    <img className="cursor-pointer" src={ln} alt="Linkedin" />
                    <img className="cursor-pointer" src={fb} alt="FaceBook" />
                    <img className="cursor-pointer" src={x_twitter} alt="X" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );

};
export default ProductPage;