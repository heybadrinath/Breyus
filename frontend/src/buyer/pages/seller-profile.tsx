/**
 * Seller Profile Page
 * Allows buyers to view seller company profiles with 3 tabs:
 * - Information: Company details, contact info
 * - Products: Paginated list of seller's products
 * - Emerging Interest: Seller's emerging commodity interests
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Copy,
  Check,
  BadgeCheck,
  Package,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  ShoppingCart,
  Sparkles,
  Heart,
  Loader2,
} from 'lucide-react';
import { getPublicCompanyProfile, PublicCompanyProfile } from '../../services/company.service';
import { getProductsByCompanyId } from '../../services/products.service';
import { createConversationByCompany } from '../../services/inbox.service';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  checkIsFavouriteCompany,
  addFavouriteCompany,
  removeFavouriteCompany,
} from '../../services/wishlist.service';
import { getImageUrl } from '../../utils/imageUtils';

type TabType = 'information' | 'products' | 'emerging';

interface ProductItem {
  _id: string;
  name: string;
  description?: string;
  price?: string;
  currency?: string;
  stock?: string;
  stockUnit?: string;
  moq?: string;
  moqUnit?: string;
  productImages?: string[];
  category?: string;
}

const SellerProfile: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  // State
  const [profile, setProfile] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('information');
  const [copied, setCopied] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Favourite state
  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);

  // Products tab state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 8;

  // Fetch company profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!companyId) {
        setError('Company ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPublicCompanyProfile(companyId);
        setProfile(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load company profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [companyId]);

  // Fetch products when Products tab is active
  const fetchProducts = useCallback(async () => {
    if (!companyId) return;

    try {
      setProductsLoading(true);
      const response = await getProductsByCompanyId({
        companyId,
        page: currentPage,
        limit: productsPerPage,
        search: productSearch || undefined,
      });

      setProducts(response.data || []);
      setTotalPages(response.pagination.totalPages);
      setTotalProducts(response.pagination.totalProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [companyId, currentPage, productSearch]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, fetchProducts]);

  // Check favourite status on mount
  useEffect(() => {
    const checkFavourite = async () => {
      if (!companyId) return;
      try {
        const result = await checkIsFavouriteCompany(companyId);
        setIsFavourite(result);
      } catch (err) {
        // Silently fail - user might not be logged in
        console.log('Could not check favourite status');
      }
    };
    checkFavourite();
  }, [companyId]);

  // Handle favourite toggle
  const handleFavouriteToggle = async () => {
    if (!companyId || favouriteLoading) return;

    setFavouriteLoading(true);
    try {
      if (isFavourite) {
        await removeFavouriteCompany(companyId);
        setIsFavourite(false);
        showToast('Removed from favourites', 'success');
      } else {
        await addFavouriteCompany(companyId);
        setIsFavourite(true);
        showToast('Added to favourites', 'success');
      }
    } catch (err) {
      showToast(
        isFavourite
          ? 'Failed to remove from favourites'
          : 'Failed to add to favourites',
        'error'
      );
    } finally {
      setFavouriteLoading(false);
    }
  };

  // Handle Chat Now button
  const handleChatNow = async () => {
    if (!companyId || chatLoading) return;

    try {
      setChatLoading(true);
      const result = await createConversationByCompany(companyId);

      if (result.status === 'success') {
        navigate(`/buyer/inbox?conversationId=${result.conversationId}`);
      } else if (result.message === 'Conversation already exists' && result.conversationId) {
        navigate(`/buyer/inbox?conversationId=${result.conversationId}`);
      } else if (
        result.message === "You can't send a message to yourself" ||
        (result.message && result.message.toLowerCase().includes('yourself'))
      ) {
        showToast("You can't chat with yourself.", 'error');
      } else {
        showToast(result.message || 'Failed to start conversation', 'error');
      }
    } catch (err) {
      showToast('Error starting conversation', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Share button
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = profile?.companyName || 'Seller Profile';

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out ${shareTitle} on Breyus`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  // Handle product search
  const handleProductSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  // Navigate to product details
  const handleViewProduct = (productId: string) => {
    navigate(`/buyer/product-page?id=${productId}`);
  };

  // Navigate to purchase request
  const handleQuickPurchase = (product: ProductItem) => {
    navigate(`/buyer/purchase-request?id=${product._id}&quantity=${product.moq || 1}&quantity_unit=${product.moqUnit || 'MT'}`);
  };

  // Get product image URL using centralized utility
  const getProductImage = (product: ProductItem) => {
    return getImageUrl(product.productImages?.[0], '/placeholder-product.svg');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Company Not Found</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 to-blue-800">
        {profile.bannerImage && (
          <img
            src={`${process.env.REACT_APP_BACKEND_URL}/${profile.bannerImage}`}
            alt="Company Banner"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg overflow-hidden">
                  {profile.profilePicture ? (
                    <img
                      src={`${process.env.REACT_APP_BACKEND_URL}/${profile.profilePicture}`}
                      alt={profile.companyName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    profile.companyName?.charAt(0)?.toUpperCase() || 'C'
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.companyName}</h1>
                  {profile.isKycVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <BadgeCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{profile.primaryEmail}</p>
                {profile.companyAddress && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.companyAddress}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                <button
                  onClick={handleFavouriteToggle}
                  disabled={favouriteLoading}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 ${
                    isFavourite
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                >
                  {favouriteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart
                      className={`w-4 h-4 ${isFavourite ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  )}
                </button>
                <button
                  onClick={handleChatNow}
                  disabled={chatLoading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  {chatLoading ? 'Starting...' : 'Chat Now'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-100/50 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('information')}
                className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                  activeTab === 'information'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-4 h-4 inline-block mr-2" />
                Information
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4 inline-block mr-2" />
                Products
              </button>
              <button
                onClick={() => setActiveTab('emerging')}
                className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                  activeTab === 'emerging'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Sparkles className="w-4 h-4 inline-block mr-2" />
                Emerging Interest
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Information Tab */}
            {activeTab === 'information' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h3>

                  {profile.founderName && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Founder</p>
                        <p className="text-gray-900">{profile.founderName}</p>
                      </div>
                    </div>
                  )}

                  {profile.taxId && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Tax ID</p>
                        <p className="text-gray-900">{profile.taxId}</p>
                      </div>
                    </div>
                  )}

                  {profile.tradeType && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Trade Type</p>
                        <p className="text-gray-900 capitalize">{profile.tradeType}</p>
                      </div>
                    </div>
                  )}

                  {profile.mainLineBusiness && profile.mainLineBusiness.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Main Line of Business</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {profile.mainLineBusiness.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.websiteUrl && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <a
                          href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.websiteUrl}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

                  {profile.primaryEmail && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Primary Email</p>
                        <a href={`mailto:${profile.primaryEmail}`} className="text-blue-600 hover:underline">
                          {profile.primaryEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.alternativeSalesEmail && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Sales Email</p>
                        <a href={`mailto:${profile.alternativeSalesEmail}`} className="text-blue-600 hover:underline">
                          {profile.alternativeSalesEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.companyMobile && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <a href={`tel:${profile.companyMobile}`} className="text-blue-600 hover:underline">
                          {profile.companyMobile}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.whatsappContact && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">WhatsApp</p>
                        <a
                          href={`https://wa.me/${profile.whatsappContact.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.whatsappContact}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.companyAddress && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-gray-900">{profile.companyAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                {/* Search Bar */}
                <form onSubmit={handleProductSearch} className="mb-6">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </form>

                {productsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                    <p className="text-gray-600">This seller hasn't listed any products yet.</p>
                  </div>
                ) : (
                  <>
                    {/* Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {products.map((product) => (
                        <div
                          key={product._id}
                          className="bg-white/90 backdrop-blur-sm border border-gray-100/50 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <div className="aspect-square bg-gray-100">
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                              }}
                            />
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium text-gray-900 truncate mb-1">{product.name}</h4>
                            {product.price && (
                              <p className="text-blue-600 font-semibold">
                                {product.price} {product.currency || 'USD'}
                              </p>
                            )}
                            {product.moq && (
                              <p className="text-sm text-gray-500">
                                MOQ: {product.moq} {product.moqUnit || 'MT'}
                              </p>
                            )}
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleViewProduct(product._id)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>
                              <button
                                onClick={() => handleQuickPurchase(product)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                Buy
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Showing {(currentPage - 1) * productsPerPage + 1} to{' '}
                          {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} products
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="flex items-center px-4 text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Emerging Interest Tab */}
            {activeTab === 'emerging' && (
              <div>
                {profile.tradeDetails?.emergingInterest ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Sparkles className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Emerging Commodity Interest</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{profile.tradeDetails.emergingInterest}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Emerging Interest Listed</h3>
                    <p className="text-gray-600">
                      This seller hasn't specified any emerging commodity interests yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
