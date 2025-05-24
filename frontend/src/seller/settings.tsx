import React, { useState, useEffect, useRef } from "react";
import { SettingsLayout } from "../seller/components";
import "../seller/css/settings.css"
import userProfile from "../seller/vectors/profile.svg";
import locationIcon from "../seller/vectors/location-icon.svg"
import editIcon from "../seller/vectors/edit.svg";
import verifiedIcon from "../seller/vectors/verified.svg";
import authService from "../services/auth.service";
import userDetailsService from "../services/user-details.service";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Define types
interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
}

interface UserDetails {
  contactNumber: string;
  alternateNumber1: string;
  alternateNumber2: string;
  alternateEmail: string;
  address: string;
  city: string;
  state: string;
  country: string;
  companyName: string;
  companyWebsite: string;
  gstin: string;
  companyAddress: string;
  socials: string;
  accountType: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

// Settings component
const SettingsContent = () => {
  // User data states
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit states
  const [activeEdit, setActiveEdit] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile image states
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Form data for editing
  const [nameData, setNameData] = useState<{firstName: string; lastName: string}>({
    firstName: '',
    lastName: ''
  });
  
  const [locationData, setLocationData] = useState<{city: string; state: string; country: string}>({
    city: '',
    state: '',
    country: ''
  });

  const [contactData, setContactData] = useState<{
    contactNumber: string;
    alternateNumber1: string;
    alternateNumber2: string;
    alternateEmail: string;
    address: string;
  }>({
    contactNumber: '',
    alternateNumber1: '',
    alternateNumber2: '',
    alternateEmail: '',
    address: ''
  });
  
  const [companyData, setCompanyData] = useState<{
    companyName: string;
    companyWebsite: string;
    gstin: string;
    companyAddress: string;
    socials: string;
  }>({
    companyName: '',
    companyWebsite: '',
    gstin: '',
    companyAddress: '',
    socials: ''
  });
  
  const [bankData, setBankData] = useState<{
    accountType: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  }>({
    accountType: '',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });
  
  // Animation refs
  const avatarRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);

    // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      
      try {
        // Check if user is authenticated using JWT
        if (!authService.isAuthenticated()) {
          setError("You are not logged in. Please login to view your settings.");
          setIsLoading(false);
          return;
        }
        
        // Get user data from JWT
        const user = authService.getUser();
        if (!user) {
          setError("User data not found. Please login again.");
          setIsLoading(false);
          return;
        }
        
        console.log("Loaded user data from JWT:", user);
        setUserData(user);
        
        // Initialize name data
          setNameData({
          firstName: user.firstName || '',
          lastName: user.lastName || ''
          });
        
        // Fetch detailed user info from database
        try {
          // This will use the JWT token to fetch user details from the backend
        const details = await userDetailsService.getUserDetails();
          console.log("Loaded user details from DB:", details);
        
        if (details) {
          setUserDetails(details);
            
            // Update all form data with fetched values
          setLocationData({
            city: details.city || '',
            state: details.state || '',
            country: details.country || ''
          });
            
            setContactData({
              contactNumber: details.contactNumber || '',
              alternateNumber1: details.alternateNumber1 || '',
              alternateNumber2: details.alternateNumber2 || '',
              alternateEmail: details.alternateEmail || '',
              address: details.address || ''
            });
            
            setCompanyData({
              companyName: details.companyName || '',
              companyWebsite: details.companyWebsite || '',
              gstin: details.gstin || '',
              companyAddress: details.companyAddress || '',
              socials: details.socials || ''
            });
            
            setBankData({
              accountType: details.accountType || '',
              bankName: details.bankName || '',
              accountNumber: details.accountNumber || '',
              ifscCode: details.ifscCode || ''
            });
          }
        } catch (detailsError) {
          console.error("Error fetching user details:", detailsError);
          // Don't set global error, just show message for this section
          toast.error("Failed to load user details. Using default values.");
        }
      } catch (err) {
        console.error("Error in data fetching:", err);
        setError("Failed to load user data. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Add animation when a section is updated
  const animateSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.classList.add('field-edited');
      setTimeout(() => {
        if (ref.current) {
          ref.current.classList.remove('field-edited');
        }
      }, 1000);
    }
  };
  
  // Handle input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNameData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocationData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle edit button clicks
  const startEditing = (section: string) => {
    setActiveEdit(section);
  };
  
  // Handle cancel button clicks
  const cancelEdit = () => {
    // Reset form data to current values from state
    if (userData) {
      setNameData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || ''
      });
    }
    
    if (userDetails) {
      setLocationData({
        city: userDetails.city || '',
        state: userDetails.state || '',
        country: userDetails.country || ''
      });
      
      setContactData({
        contactNumber: userDetails.contactNumber || '',
        alternateNumber1: userDetails.alternateNumber1 || '',
        alternateNumber2: userDetails.alternateNumber2 || '',
        alternateEmail: userDetails.alternateEmail || '',
        address: userDetails.address || ''
      });
      
      setCompanyData({
        companyName: userDetails.companyName || '',
        companyWebsite: userDetails.companyWebsite || '',
        gstin: userDetails.gstin || '',
        companyAddress: userDetails.companyAddress || '',
        socials: userDetails.socials || ''
      });
      
      setBankData({
        accountType: userDetails.accountType || '',
        bankName: userDetails.bankName || '',
        accountNumber: userDetails.accountNumber || '',
        ifscCode: userDetails.ifscCode || ''
      });
    }
    
    setActiveEdit(null);
  };

  // Handle image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImageFile) return;
    
    setIsUploadingImage(true);
    try {
      const imageUrl = await authService.uploadProfileImage(selectedImageFile);
      
      // Update user profile with new image
      await authService.updateUserProfile({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        profileImage: imageUrl
      });
      
      // Update local state
      setUserData(prev => prev ? { ...prev, profileImage: imageUrl } : null);
      setImagePreview(null);
      setSelectedImageFile(null);
      
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save profile (name, location, and optionally image)
  const saveProfile = async () => {
    try {
      setIsSaving(true);

      // Validate form data
      if (!nameData.firstName.trim()) {
        toast.error("First name cannot be empty");
        return;
      }

      // Prepare profile data
      const profileData: any = {
        firstName: nameData.firstName,
        lastName: nameData.lastName
      };

      // If there's a new image, upload it first
      if (selectedImageFile) {
        setIsUploadingImage(true);
        try {
          const imageUrl = await authService.uploadProfileImage(selectedImageFile);
          profileData.profileImage = imageUrl;
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          toast.error('Failed to upload profile image');
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Update user profile in auth service
      await authService.updateUserProfile(profileData);
      
      // Update user location in user details service
      await userDetailsService.updateMultipleDetails({
        city: locationData.city,
        state: locationData.state,
        country: locationData.country
        });
      
      // Update local state
      setUserData(prev => {
          if (prev) {
            return {
              ...prev,
            firstName: nameData.firstName,
            lastName: nameData.lastName,
            ...(profileData.profileImage && { profileImage: profileData.profileImage })
            };
          }
          return prev;
        });
        
        setUserDetails(prev => {
          if (prev) {
            return {
              ...prev,
            city: locationData.city,
            state: locationData.state,
            country: locationData.country
            };
          }
          return prev;
        });
        
      // Clear image selection
      setSelectedImageFile(null);
      setImagePreview(null);
      
      // Show success message
      toast.success("Profile updated successfully");
      animateSection(avatarRef);
      setActiveEdit(null);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Save contact information
  const saveContactInfo = async () => {
    try {
      setIsSaving(true);
      
      // Update user details in database
      await userDetailsService.updateMultipleDetails(contactData);
      
      // Update local state
        setUserDetails(prev => {
          if (prev) {
          return { ...prev, ...contactData };
          }
        return prev;
        });
        
      // Show success message
        toast.success("Contact information updated successfully");
      animateSection(contactRef);
      setActiveEdit(null);
    } catch (error) {
      console.error("Error saving contact info:", error);
      toast.error("Failed to update contact information");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Save company information
  const saveCompanyInfo = async () => {
    try {
      setIsSaving(true);
      
      // Update company details in database
      await userDetailsService.updateMultipleDetails(companyData);
      
      // Update local state
        setUserDetails(prev => {
          if (prev) {
            return { ...prev, ...companyData };
          }
        return prev;
        });
        
      // Show success message
        toast.success("Company information updated successfully");
      animateSection(companyRef);
      setActiveEdit(null);
    } catch (error) {
      console.error("Error saving company info:", error);
      toast.error("Failed to update company information");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Save bank details
  const saveBankDetails = async () => {
    try {
      setIsSaving(true);
      
      // Update bank details in database
      await userDetailsService.updateMultipleDetails(bankData);
      
      // Update local state
        setUserDetails(prev => {
          if (prev) {
            return { ...prev, ...bankData };
          }
        return prev;
        });
        
      // Show success message
        toast.success("Bank details updated successfully");
      animateSection(bankRef);
      setActiveEdit(null);
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast.error("Failed to update bank details");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Derived values for display
  const fullName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : '';
  const location = `${locationData.city || ''} ${locationData.state || ''}`.trim();
  
  // Loading state
  if (isLoading) {
    return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        <p>Loading your profile information...</p>
        </div>
    );
  }

  // Error state
  if (error) {
    return (
        <div className="error-container">
          <p className="error-message">{error}</p>
        <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
    );
  }

    return (
    <div className="settings-container">
      {/* User Profile Section */}
      <div id="user-avatar" ref={avatarRef}>
        <div className="relative">
          <img 
            alt="Profile" 
            src={userData?.profileImage || imagePreview || userProfile} 
            id="user-profile-picture"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
          />
          
          {/* Image upload overlay */}
          {activeEdit === 'profile' && (
            <div className="mt-4">
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                {imagePreview && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-300"
                    />
                    <button
                      onClick={handleImageUpload}
                      disabled={isUploadingImage}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isUploadingImage ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div id="user-profile-name-location">
          {activeEdit === 'profile' ? (
            <div className="edit-name-container">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={nameData.firstName}
                onChange={handleNameChange}
                className="edit-input"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={nameData.lastName}
                onChange={handleNameChange}
                className="edit-input"
              />
              <div className="location-edit-container">
                <h3>Location Information</h3>
                <div className="location-row">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={locationData.city}
                    onChange={handleLocationChange}
                    className="edit-input"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={locationData.state}
                    onChange={handleLocationChange}
                    className="edit-input"
                  />
                </div>
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={locationData.country}
                  onChange={handleLocationChange}
                  className="edit-input"
                />
              </div>
              <div className="edit-help-message">
                This information will be used throughout the platform
              </div>
            </div>
          ) : (
            <h1>{fullName || "Not set"}</h1>
          )}
          <h1 id="location-container-h1">
            <img alt="" src={locationIcon} />
            {location || "Location not set"}
          </h1>
        </div>
        {activeEdit === 'profile' ? (
          <div className="edit-button-container">
            <button 
              className="save-button" 
              onClick={saveProfile}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="cancel-button" 
              onClick={cancelEdit}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="edit-container" onClick={() => startEditing('profile')}>
            Edit <img alt="" src={editIcon} />
          </div>
        )}
      </div>

      {/* Contact Information Section */}
      <div className="contact-information" ref={contactRef}>
        <div className="contact-information-header">
          <h1>Contact Information</h1>
          {activeEdit === 'contact' ? (
            <div className="edit-button-container">
              <button 
                className="save-button" 
                onClick={saveContactInfo}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-button" 
                onClick={cancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="edit-container" onClick={() => startEditing('contact')}>
              Edit <img alt="" src={editIcon} />
            </div>
          )}
        </div>

        <div className="contact-information-content">
          <div>
            <p>Contact Number</p>
            {activeEdit === 'contact' ? (
              <input
                type="text"
                name="contactNumber"
                placeholder="Phone number"
                value={contactData.contactNumber}
                onChange={handleContactChange}
                className="edit-input"
              />
            ) : (
              <>{contactData.contactNumber || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Alternate Contact 1</p>
            {activeEdit === 'contact' ? (
              <input
                type="text"
                name="alternateNumber1"
                placeholder="Alternative phone number"
                value={contactData.alternateNumber1}
                onChange={handleContactChange}
                className="edit-input"
              />
            ) : (
              <>{contactData.alternateNumber1 || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Alternate Contact 2</p>
            {activeEdit === 'contact' ? (
              <input
                type="text"
                name="alternateNumber2"
                placeholder="Alternative phone number"
                value={contactData.alternateNumber2}
                onChange={handleContactChange}
                className="edit-input"
              />
            ) : (
              <>{contactData.alternateNumber2 || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>

        <div className="contact-information-content">
          <div>
            <p>Primary Email</p>
            {userData?.email || 'Not set'} <img alt="" src={verifiedIcon} />
          </div>
          <div>
            <p>Alternate Email</p>
            {activeEdit === 'contact' ? (
              <input
                type="text"
                name="alternateEmail"
                placeholder="Alternative email"
                value={contactData.alternateEmail}
                onChange={handleContactChange}
                className="edit-input"
              />
            ) : (
              <>{contactData.alternateEmail || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>

        <div className="contact-information-content">
          <div>
            <p>Address</p>
            {activeEdit === 'contact' ? (
              <input
                type="text"
                  name="address"
                  placeholder="Street address"
                value={contactData.address}
                onChange={handleContactChange}
                  className="edit-input full-width"
                />
            ) : (
              <>{contactData.address || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>
      </div>

      {/* Company Information Section */}
      <div className="contact-information" ref={companyRef}>
        <div className="contact-information-header">
          <h1>Company Information</h1>
          {activeEdit === 'company' ? (
            <div className="edit-button-container">
              <button 
                className="save-button" 
                onClick={saveCompanyInfo}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-button"
                onClick={cancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="edit-container" onClick={() => startEditing('company')}>
              Edit <img alt="" src={editIcon} />
            </div>
          )}
        </div>

        <div className="contact-information-content">
          <div>
            <p>Company Name</p>
            {activeEdit === 'company' ? (
              <input
                type="text"
                name="companyName"
                placeholder="Company name"
                value={companyData.companyName}
                onChange={handleCompanyChange}
                className="edit-input"
              />
            ) : (
              <>{companyData.companyName || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Company Website</p>
            {activeEdit === 'company' ? (
              <input
                type="text"
                name="companyWebsite"
                placeholder="Website URL"
                value={companyData.companyWebsite}
                onChange={handleCompanyChange}
                className="edit-input"
              />
            ) : (
              <>{companyData.companyWebsite || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>

        <div className="contact-information-content">
          <div>
            <p>GSTIN</p>
            {activeEdit === 'company' ? (
              <input
                type="text"
                name="gstin"
                placeholder="GSTIN"
                value={companyData.gstin}
                onChange={handleCompanyChange}
                className="edit-input"
              />
            ) : (
              <>{companyData.gstin || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Company Address</p>
            {activeEdit === 'company' ? (
              <input
                type="text"
                name="companyAddress"
                placeholder="Company address"
                value={companyData.companyAddress}
                onChange={handleCompanyChange}
                className="edit-input"
              />
            ) : (
              <>{companyData.companyAddress || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>

        <div className="contact-information-content">
          <div>
            <p>Socials</p>
            {activeEdit === 'company' ? (
              <input
                type="text"
                name="socials"
                placeholder="Social media links"
                value={companyData.socials}
                onChange={handleCompanyChange}
                className="edit-input"
              />
            ) : (
              <>{companyData.socials || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="contact-information" ref={bankRef}>
        <div className="contact-information-header">
          <h1>Bank Details</h1>
          {activeEdit === 'bank' ? (
            <div className="edit-button-container">
              <button 
                className="save-button" 
                onClick={saveBankDetails}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-button" 
                onClick={cancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="edit-container" onClick={() => startEditing('bank')}>
              Edit <img alt="" src={editIcon} />
            </div>
          )}
        </div>

        <div className="contact-information-content">
          <div>
            <p>IFSC Code</p>
            {activeEdit === 'bank' ? (
              <input
                type="text"
                name="ifscCode"
                placeholder="IFSC Code"
                value={bankData.ifscCode}
                onChange={handleBankChange}
                className="edit-input"
              />
            ) : (
              <>{bankData.ifscCode || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Account Number</p>
            {activeEdit === 'bank' ? (
              <input
                type="text"
                name="accountNumber"
                placeholder="Account Number"
                value={bankData.accountNumber}
                onChange={handleBankChange}
                className="edit-input"
              />
            ) : (
              <>{bankData.accountNumber || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>

        <div className="contact-information-content">
          <div>
            <p>Bank Name</p>
            {activeEdit === 'bank' ? (
              <input
                type="text"
                name="bankName"
                placeholder="Bank Name"
                value={bankData.bankName}
                onChange={handleBankChange}
                className="edit-input"
              />
            ) : (
              <>{bankData.bankName || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Account Type</p>
            {activeEdit === 'bank' ? (
              <input
                type="text"
                name="accountType"
                placeholder="Account Type"
                value={bankData.accountType}
                onChange={handleBankChange}
                className="edit-input"
              />
            ) : (
              <>{bankData.accountType || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast notification container */}
      <ToastContainer position="bottom-right" aria-label="Notifications" />
      </div>
    );
};

// Main settings component
const Settings = () => {
  return (
    <SettingsLayout Body={<SettingsContent />} />
  );
};

export default Settings;