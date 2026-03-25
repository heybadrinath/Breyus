/**
 * Wishlist Page
 * Displays user's wishlisted products, favourite companies, and saved AI contacts
 * - Products tab: Traditional product wishlist
 * - Companies tab: Favourite seller companies
 * - Contacts tab: AI-discovered trade partners saved for later
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package,
  Building2,
  Heart,
  BadgeCheck,
  MapPin,
  ArrowRight,
  Loader2,
  Users,
  Mail,
  Phone,
  Globe,
  Trash2,
  Sparkles,
  Save,
  X,
  Calendar,
  Percent,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { SearchHeader } from '../../components/Header';
import {
  getWishlist,
  getFavouriteCompanies,
  removeFavouriteCompany,
  FavouriteCompany,
} from '../../services/wishlist.service';
import {
  getSavedContacts,
  removeSavedContact,
  updateContactNotes,
} from '../../services/ai.service';
import { SavedContact } from '../../types/aiTypes';
import { useNotifications } from '../../contexts/NotificationContext';
import { getImageUrl } from '../../utils/imageUtils';

type TabType = 'products' | 'companies' | 'contacts';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useNotifications();

  // Tab state from URL
  const currentTab = (searchParams.get('tab') as TabType) || 'products';

  // Products state
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Companies state
  const [favouriteCompanies, setFavouriteCompanies] = useState<FavouriteCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [removingCompanyId, setRemovingCompanyId] = useState<string | null>(null);

  // Contacts state
  const [savedContacts, setSavedContacts] = useState<SavedContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [removingContactId, setRemovingContactId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Fetch products when products tab is active
  useEffect(() => {
    if (currentTab === 'products') {
      setProductsLoading(true);
      getWishlist()
        .then(setWishlistItems)
        .catch(() => setWishlistItems([]))
        .finally(() => setProductsLoading(false));
    }
  }, [currentTab]);

  // Fetch companies when companies tab is active
  useEffect(() => {
    if (currentTab === 'companies') {
      setCompaniesLoading(true);
      getFavouriteCompanies()
        .then(setFavouriteCompanies)
        .catch(() => setFavouriteCompanies([]))
        .finally(() => setCompaniesLoading(false));
    }
  }, [currentTab]);

  // Fetch contacts when contacts tab is active
  useEffect(() => {
    if (currentTab === 'contacts') {
      setContactsLoading(true);
      getSavedContacts()
        .then((response) => {
          setSavedContacts(response.data || []);
        })
        .catch(() => setSavedContacts([]))
        .finally(() => setContactsLoading(false));
    }
  }, [currentTab]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  // Handle remove favourite company
  const handleRemoveFavourite = async (companyId: string, companyName: string) => {
    setRemovingCompanyId(companyId);
    try {
      await removeFavouriteCompany(companyId);
      setFavouriteCompanies((prev) => prev.filter((c) => c.companyId !== companyId));
      showToast(`${companyName} removed from favourites`, 'success');
    } catch (err) {
      showToast('Failed to remove company from favourites', 'error');
    } finally {
      setRemovingCompanyId(null);
    }
  };

  // Handle remove contact
  const handleRemoveContact = async (contactId: string, contactName: string) => {
    setRemovingContactId(contactId);
    try {
      await removeSavedContact(contactId);
      setSavedContacts((prev) => prev.filter((c) => c.id !== contactId));
      showToast(`${contactName} removed from contacts`, 'success');
    } catch (err) {
      showToast('Failed to remove contact', 'error');
    } finally {
      setRemovingContactId(null);
    }
  };

  // Handle edit notes
  const handleStartEditNotes = (contact: SavedContact) => {
    setEditingContactId(contact.id || null);
    setEditNotes(contact.notes || '');
  };

  const handleCancelEditNotes = () => {
    setEditingContactId(null);
    setEditNotes('');
  };

  const handleSaveNotes = async (contactId: string) => {
    setSavingNotes(true);
    try {
      await updateContactNotes(contactId, editNotes);
      setSavedContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, notes: editNotes } : c))
      );
      showToast('Notes updated successfully', 'success');
      setEditingContactId(null);
      setEditNotes('');
    } catch (err) {
      showToast('Failed to update notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  // Get profile image URL - using centralized utility
  const getProfileImage = (profilePicture: string) => {
    return profilePicture ? getImageUrl(profilePicture, '') : null;
  };

  // Get banner image URL - using centralized utility
  const getBannerImage = (bannerImage: string) => {
    return bannerImage ? getImageUrl(bannerImage, '') : null;
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur">
        <SearchHeader />
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-1">Your saved products, companies, and AI contacts</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-100/50 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange('products')}
                className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  currentTab === 'products'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4" />
                Products
                {wishlistItems.length > 0 && currentTab === 'products' && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {wishlistItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('companies')}
                className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  currentTab === 'companies'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Companies
                {favouriteCompanies.length > 0 && currentTab === 'companies' && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {favouriteCompanies.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('contacts')}
                className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  currentTab === 'contacts'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                Contacts
                {savedContacts.length > 0 && currentTab === 'contacts' && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {savedContacts.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Products Tab */}
            {currentTab === 'products' && (
              <>
                {productsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Saved</h3>
                    <p className="text-gray-600 mb-4 text-center">
                      Browse products and add them to your wishlist
                    </p>
                    <button
                      onClick={() => navigate('/buyer/homepage')}
                      className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {wishlistItems.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={() => navigate(`/buyer/product-page?id=${product.id}`)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Companies Tab */}
            {currentTab === 'companies' && (
              <>
                {companiesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : favouriteCompanies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Favourite Companies</h3>
                    <p className="text-gray-600 mb-4 text-center">
                      Browse seller profiles and add them to your favourites
                    </p>
                    <button
                      onClick={() => navigate('/buyer/homepage')}
                      className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Discover Sellers
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favouriteCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="bg-white/80 backdrop-blur-xl border border-gray-100/50 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                      >
                        {/* Banner */}
                        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-700 relative">
                          {getBannerImage(company.bannerImage) && (
                            <img
                              src={getBannerImage(company.bannerImage)!}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          {/* Favourite Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFavourite(company.companyId, company.companyName);
                            }}
                            disabled={removingCompanyId === company.companyId}
                            className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors disabled:opacity-50"
                            title="Remove from favourites"
                          >
                            {removingCompanyId === company.companyId ? (
                              <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                            ) : (
                              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                            )}
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 relative">
                          {/* Avatar */}
                          <div className="absolute -top-8 left-4">
                            <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
                              {getProfileImage(company.profilePicture) ? (
                                <img
                                  src={getProfileImage(company.profilePicture)!}
                                  alt={company.companyName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-white text-xl font-bold">${company.companyName.charAt(0).toUpperCase()}</span>`;
                                  }}
                                />
                              ) : (
                                <span className="text-white text-xl font-bold">
                                  {company.companyName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Company Info */}
                          <div className="mt-10">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {company.companyName}
                              </h3>
                              {company.isKycVerified && (
                                <BadgeCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                              )}
                            </div>

                            {company.companyAddress && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 truncate mb-3">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                {company.companyAddress}
                              </p>
                            )}

                            {/* View Profile Button */}
                            <button
                              onClick={() => navigate(`/buyer/seller-profile/${company.companyId}`)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors group"
                            >
                              View Profile
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Contacts Tab */}
            {currentTab === 'contacts' && (
              <>
                {contactsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : savedContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Contacts</h3>
                    <p className="text-gray-600 mb-4 text-center max-w-md">
                      Use Breyus AI to discover potential trade partners and save them here for later
                    </p>
                    <button
                      onClick={() => navigate('/buyer/ai')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Discover with AI
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b border-gray-100">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {contact.name}
                              </h3>
                              <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {contact.role === 'seller' ? 'Seller' : 'Buyer'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveContact(contact.id!, contact.name)}
                              disabled={removingContactId === contact.id}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove contact"
                            >
                              {removingContactId === contact.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-4 space-y-3">
                          {/* Contact Info */}
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.country && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span>{contact.country}</span>
                            </div>
                          )}

                          {/* Commodity & Score */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            {contact.commodity && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {contact.commodity}
                              </span>
                            )}
                            {contact.matchScore !== undefined && (
                              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                <Percent className="w-3 h-3" />
                                {Math.round(contact.matchScore)}% match
                              </span>
                            )}
                          </div>

                          {/* Notes Section */}
                          <div className="pt-2 border-t border-gray-100">
                            {editingContactId === contact.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  placeholder="Add notes about this contact..."
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  rows={3}
                                />
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    onClick={handleCancelEditNotes}
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveNotes(contact.id!)}
                                    disabled={savingNotes}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                  >
                                    {savingNotes ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Save className="w-3 h-3" />
                                    )}
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleStartEditNotes(contact)}
                                className="group cursor-pointer"
                              >
                                {contact.notes ? (
                                  <p className="text-sm text-gray-600 group-hover:text-gray-900">
                                    {contact.notes}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-400 italic group-hover:text-gray-600">
                                    Click to add notes...
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Date Added */}
                          {contact.dateAdded && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 pt-2">
                              <Calendar className="w-3 h-3" />
                              Saved {formatDate(contact.dateAdded)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
