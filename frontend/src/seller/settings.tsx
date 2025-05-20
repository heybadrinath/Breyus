import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Create a type that makes all fields optional for form data
type UserDetailsFormData = Partial<UserDetails>;

// Settings page starting point 
const Settings = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit states
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  
  // Form data for editing - use the UserDetailsFormData type
  const [formData, setFormData] = useState<UserDetailsFormData>({});
  const [nameData, setNameData] = useState({
    firstName: '',
    lastName: ''
  });
  const [locationData, setLocationData] = useState({
    city: '',
    state: '',
    country: ''
  });

  // Refs for animations
  const avatarRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);

  // Loading states for save operations
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Create refs for all input fields to maintain focus
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  
  // Contact section refs
  const contactNumberRef = useRef<HTMLInputElement>(null);
  const alternateNumber1Ref = useRef<HTMLInputElement>(null);
  const alternateNumber2Ref = useRef<HTMLInputElement>(null);
  const alternateEmailRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const contactCityRef = useRef<HTMLInputElement>(null);
  const contactStateRef = useRef<HTMLInputElement>(null);
  const contactCountryRef = useRef<HTMLInputElement>(null);
  
  // Company section refs
  const companyNameRef = useRef<HTMLInputElement>(null);
  const companyWebsiteRef = useRef<HTMLInputElement>(null);
  const gstinRef = useRef<HTMLInputElement>(null);
  const companyAddressRef = useRef<HTMLInputElement>(null);
  const socialsRef = useRef<HTMLInputElement>(null);
  
  // Bank section refs
  const ifscCodeRef = useRef<HTMLInputElement>(null);
  const accountNumberRef = useRef<HTMLInputElement>(null);
  const bankNameRef = useRef<HTMLInputElement>(null);
  const accountTypeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch user data on component mount
    const fetchUserData = async () => {
      setIsLoading(true);
      
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          setError("You are not logged in. Please login to view your settings.");
          setIsLoading(false);
          return;
        }
        
        // Get the user from auth service
        const userData = authService.getUser();
        setUser(userData);
        
        if (userData?.firstName && userData?.lastName) {
          setNameData({
            firstName: userData.firstName,
            lastName: userData.lastName
          });
        }
        
        // Fetch user details
        const details = await userDetailsService.getUserDetails();
        
        if (details) {
          setUserDetails(details);
          setFormData(details);
          setLocationData({
            city: details.city || '',
            state: details.state || '',
            country: details.country || ''
          });
        } else {
          // Initialize with empty details if not available
          const emptyDetails: UserDetails = {
            contactNumber: '',
            alternateNumber1: '',
            alternateNumber2: '',
            alternateEmail: '',
            address: '',
            city: '',
            state: '',
            country: '',
            companyName: '',
            companyWebsite: '',
            gstin: '',
            companyAddress: '',
            socials: '',
            accountType: '',
            bankName: '',
            accountNumber: '',
            ifscCode: ''
          };
          setUserDetails(emptyDetails);
          setFormData(emptyDetails);
          setLocationData({
            city: '',
            state: '',
            country: ''
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Add animation class to section when editing
  useEffect(() => {
    if (editingAvatar && avatarRef.current) {
      avatarRef.current.classList.add('update-success');
      setTimeout(() => {
        if (avatarRef.current) {
          avatarRef.current.classList.remove('update-success');
        }
      }, 1000);
    }
  }, [editingAvatar]);

  useEffect(() => {
    if (editingContact && contactRef.current) {
      contactRef.current.classList.add('update-success');
      setTimeout(() => {
        if (contactRef.current) {
          contactRef.current.classList.remove('update-success');
        }
      }, 1000);
    }
  }, [editingContact]);

  useEffect(() => {
    if (editingCompany && companyRef.current) {
      companyRef.current.classList.add('update-success');
      setTimeout(() => {
        if (companyRef.current) {
          companyRef.current.classList.remove('update-success');
        }
      }, 1000);
    }
  }, [editingCompany]);

  useEffect(() => {
    if (editingBank && bankRef.current) {
      bankRef.current.classList.add('update-success');
      setTimeout(() => {
        if (bankRef.current) {
          bankRef.current.classList.remove('update-success');
        }
      }, 1000);
    }
  }, [editingBank]);
  
  // Use React.memo to prevent unnecessary re-renders
  const MemoizedInput = React.memo(
    ({ type = "text", name, value, onChange, placeholder, className, inputRef }: {
      type?: string;
      name: string;
      value: string;
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
      placeholder: string;
      className: string;
      inputRef?: React.RefObject<HTMLInputElement | null>;
    }) => {
      return (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={className}
          ref={inputRef}
        />
      );
    },
    (prevProps, nextProps) => prevProps.value === nextProps.value
  );

  // Add a function to update state with focus preservation
  function setStateWithFocusPreservation<T>(
    state: T,
    setState: React.Dispatch<React.SetStateAction<T>>,
    update: Partial<T>
  ) {
    // Store the current active element
    const activeElement = document.activeElement;
    
    // Update state
    setState(prev => ({ ...prev, ...update }));
    
    // After state update, restore focus
    requestAnimationFrame(() => {
      if (activeElement instanceof HTMLElement) {
        activeElement.focus();
      }
    });
  }

  // Replace handlers with these more effective versions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Use our custom state setter with focus preservation
    setStateWithFocusPreservation(formData, setFormData, { [name]: value });
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Use our custom state setter with focus preservation
    setStateWithFocusPreservation(nameData, setNameData, { [name]: value });
  }, []);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Use our custom state setter with focus preservation
    setStateWithFocusPreservation(locationData, setLocationData, { [name]: value });
  }, []);

  // Save user profile (name and location)
  const saveUserProfile = async () => {
    try {
      setIsSavingProfile(true);

      // Validate input
      if (!nameData.firstName.trim() || !nameData.lastName.trim()) {
        toast.error("First name and last name cannot be empty");
        return;
      }

      // Update user profile in the database using authService
      const profileData = {
        firstName: nameData.firstName.trim(),
        lastName: nameData.lastName.trim()
      };
      
      // Update user's name
      const response = await authService.updateUserProfile(profileData);
      
      // Check for valid location data
      if (locationData.city.trim() || locationData.state.trim() || locationData.country.trim()) {
        // Update user's location
        const locationResponse = await userDetailsService.updateMultipleDetails({
          city: locationData.city.trim(),
          state: locationData.state.trim(), 
          country: locationData.country.trim()
        });
        
        if (!locationResponse) {
          toast.error("Failed to update location information");
          console.error("Error updating location information");
        }
      }
      
      // If successful, update the local state
      if (response) {
        setUser(prev => {
          if (prev) {
            return {
              ...prev,
              firstName: profileData.firstName,
              lastName: profileData.lastName
            };
          }
          return prev;
        });
        
        setUserDetails(prev => {
          if (prev) {
            return {
              ...prev,
              city: locationData.city.trim(),
              state: locationData.state.trim(),
              country: locationData.country.trim()
            };
          }
          return prev;
        });
        
        // Show success notification with animation
        toast.success("Profile information updated successfully");
        
        if (avatarRef.current) {
          avatarRef.current.classList.add('field-edited');
          setTimeout(() => {
            if (avatarRef.current) {
              avatarRef.current.classList.remove('field-edited');
            }
          }, 1500);
        }
        
        setEditingAvatar(false);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Failed to update profile information");
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  // Save contact information
  const saveContactInfo = async () => {
    try {
      setIsSavingContact(true);
      
      const contactData = {
        contactNumber: formData.contactNumber || '',
        alternateNumber1: formData.alternateNumber1 || '',
        alternateNumber2: formData.alternateNumber2 || '',
        alternateEmail: formData.alternateEmail || '',
        address: formData.address || ''
      };
      
      const response = await userDetailsService.updateMultipleDetails(contactData);
      
      if (response) {
        setUserDetails(prev => {
          if (prev) {
            return { 
              ...prev, 
              ...contactData,
              // Keep existing location data
              city: prev.city,
              state: prev.state,
              country: prev.country
            };
          }
          // If prev is null, create a new object with default empty values
          return {
            ...contactData,
            city: '',
            state: '',
            country: '',
            companyName: '',
            companyWebsite: '',
            gstin: '',
            companyAddress: '',
            socials: '',
            accountType: '',
            bankName: '',
            accountNumber: '',
            ifscCode: ''
          };
        });
        
        // Show success notification with animation
        toast.success("Contact information updated successfully");
        
        if (contactRef.current) {
          contactRef.current.classList.add('field-edited');
          setTimeout(() => {
            if (contactRef.current) {
              contactRef.current.classList.remove('field-edited');
            }
          }, 1500);
        }
        
        setEditingContact(false);
      }
    } catch (err) {
      console.error("Error saving contact information:", err);
      toast.error("Failed to update contact information");
    } finally {
      setIsSavingContact(false);
    }
  };
  
  // Save company information
  const saveCompanyInfo = async () => {
    try {
      setIsSavingCompany(true);
      
      const companyData = {
        companyName: formData.companyName || '',
        companyWebsite: formData.companyWebsite || '',
        gstin: formData.gstin || '',
        companyAddress: formData.companyAddress || '',
        socials: formData.socials || ''
      };
      
      const response = await userDetailsService.updateMultipleDetails(companyData);
      
      if (response) {
        setUserDetails(prev => {
          if (prev) {
            return { ...prev, ...companyData };
          }
          // If prev is null, create a new object with default empty values
          return {
            ...companyData,
            contactNumber: '',
            alternateNumber1: '',
            alternateNumber2: '',
            alternateEmail: '',
            address: '',
            city: '',
            state: '',
            country: '',
            accountType: '',
            bankName: '',
            accountNumber: '',
            ifscCode: ''
          };
        });
        
        // Show success notification with animation
        toast.success("Company information updated successfully");
        
        if (companyRef.current) {
          companyRef.current.classList.add('field-edited');
          setTimeout(() => {
            if (companyRef.current) {
              companyRef.current.classList.remove('field-edited');
            }
          }, 1500);
        }
        
        setEditingCompany(false);
      }
    } catch (err) {
      console.error("Error saving company information:", err);
      toast.error("Failed to update company information");
    } finally {
      setIsSavingCompany(false);
    }
  };
  
  // Save bank details
  const saveBankDetails = async () => {
    try {
      setIsSavingBank(true);
      
      const bankData = {
        accountType: formData.accountType || '',
        bankName: formData.bankName || '',
        accountNumber: formData.accountNumber || '',
        ifscCode: formData.ifscCode || ''
      };
      
      const response = await userDetailsService.updateMultipleDetails(bankData);
      
      if (response) {
        setUserDetails(prev => {
          if (prev) {
            return { ...prev, ...bankData };
          }
          // If prev is null, create a new object with default empty values
          return {
            ...bankData,
            contactNumber: '',
            alternateNumber1: '',
            alternateNumber2: '',
            alternateEmail: '',
            address: '',
            city: '',
            state: '',
            country: '',
            companyName: '',
            companyWebsite: '',
            gstin: '',
            companyAddress: '',
            socials: ''
          };
        });
        
        // Show success notification with animation
        toast.success("Bank details updated successfully");
        
        if (bankRef.current) {
          bankRef.current.classList.add('field-edited');
          setTimeout(() => {
            if (bankRef.current) {
              bankRef.current.classList.remove('field-edited');
            }
          }, 1500);
        }
        
        setEditingBank(false);
      }
    } catch (err) {
      console.error("Error saving bank details:", err);
      toast.error("Failed to update bank details");
    } finally {
      setIsSavingBank(false);
    }
  };
  
  // Cancel editing
  const cancelEditing = (section: string) => {
    // Reset form data to current user details
    setFormData(userDetails || {});
    
    // Reset name and location data
    if (section === 'avatar') {
      setNameData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || ''
      });
      setLocationData({
        city: userDetails?.city || '',
        state: userDetails?.state || '',
        country: userDetails?.country || ''
      });
      setEditingAvatar(false);
    } else if (section === 'contact') {
      setEditingContact(false);
    } else if (section === 'company') {
      setEditingCompany(false);
    } else if (section === 'bank') {
      setEditingBank(false);
    }
  };

  // Update the IsolatedInput component to prevent re-renders when switching fields
  const IsolatedInput = React.memo(({ 
    initialValue = "", 
    name, 
    placeholder, 
    className, 
    onBlur 
  }: {
    initialValue: string;
    name: string;
    placeholder: string;
    className: string;
    onBlur: (name: string, value: string) => void;
  }) => {
    // Use internal state to prevent parent re-renders from affecting this component
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastValueRef = useRef(initialValue);
    
    // Update local value if initialValue changes (e.g., when form data is reset)
    useEffect(() => {
      setValue(initialValue);
      lastValueRef.current = initialValue;
    }, [initialValue]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    };
    
    const handleBlur = () => {
      // Only update parent state if value actually changed
      if (value !== lastValueRef.current) {
        lastValueRef.current = value;
        onBlur(name, value);
      }
    };
    
    // Prevent default behavior of blur when tabbing between fields
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Tab') {
        // Let the tab event continue normally for focus movement
        // but prevent the default blur/focus behavior
        e.stopPropagation();
      }
    };
    
    return (
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        ref={inputRef}
      />
    );
  }, (prevProps, nextProps) => prevProps.initialValue === nextProps.initialValue);

  // Add a debounced update function to prevent frequent re-renders
  const useDebouncedCallback = (callback: Function, delay: number) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    return useCallback((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }, [callback, delay]);
  };

  // Add a batch update mechanism to prevent frequent state updates
  const useBatchedUpdates = () => {
    const pendingUpdatesRef = useRef<{[key: string]: any}>({});
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const batchUpdate = useCallback((state: any, setState: any, updates: {[key: string]: any}, delay = 500) => {
      // Add to pending updates
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout to apply all pending updates at once
      timeoutRef.current = setTimeout(() => {
        setState((prev: any) => ({
          ...prev,
          ...pendingUpdatesRef.current
        }));
        pendingUpdatesRef.current = {};
      }, delay);
    }, []);
    
    return batchUpdate;
  };

  // Use the batch update mechanism
  const batchUpdate = useBatchedUpdates();

  // Update the blur handlers to use batched updates
  const handleInputBlur = useCallback((name: string, value: string) => {
    batchUpdate(formData, setFormData, { [name]: value });
  }, [formData, batchUpdate]);

  const handleNameBlur = useCallback((name: string, value: string) => {
    batchUpdate(nameData, setNameData, { [name]: value });
  }, [nameData, batchUpdate]);

  const handleLocationBlur = useCallback((name: string, value: string) => {
    batchUpdate(locationData, setLocationData, { [name]: value });
  }, [locationData, batchUpdate]);

  if (isLoading) {
    return (
      <SettingsLayout Body={
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading user settings...</p>
        </div>
      } />
    );
  }

  if (error) {
    return (
      <SettingsLayout Body={
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      } />
    );
  }

  // Combine first and last name for display
  const username = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Demo User' : 'Demo User';
  
  // Build location string
  const location = `${userDetails?.city || ''} ${userDetails?.state || ''}`.trim() || 'Location not set';

  // Modify the Useravatar component
  const Useravatar = React.memo(() => {
    return (
      <div id="user-avatar" ref={avatarRef}>
        <img alt="" src={userProfile} id="user-profile-picture" />
        <div id="user-profile-name-location">
          {editingAvatar ? (
            <div className="edit-name-container">
              <IsolatedInput
                name="firstName"
                placeholder="First Name"
                initialValue={nameData.firstName}
                onBlur={handleNameBlur}
                className="edit-input"
              />
              <IsolatedInput
                name="lastName"
                placeholder="Last Name"
                initialValue={nameData.lastName}
                onBlur={handleNameBlur}
                className="edit-input"
              />
              <div className="location-edit-container">
                <h3>Location Information</h3>
                <div className="location-row">
                  <IsolatedInput
                    name="city"
                    placeholder="City"
                    initialValue={locationData.city}
                    onBlur={handleLocationBlur}
                    className="edit-input"
                  />
                  <IsolatedInput
                    name="state"
                    placeholder="State"
                    initialValue={locationData.state}
                    onBlur={handleLocationBlur}
                    className="edit-input"
                  />
                </div>
                <IsolatedInput
                  name="country"
                  placeholder="Country"
                  initialValue={locationData.country}
                  onBlur={handleLocationBlur}
                  className="edit-input"
                />
              </div>
              <div className="edit-help-message">
                This information will be used to identify you throughout the platform
              </div>
            </div>
          ) : (
            <h1>{username}</h1>
          )}
          <h1 id="location-container-h1">
            <img alt="" src={locationIcon} />
            {location}
          </h1>
        </div>
        {editingAvatar ? (
          <div className="edit-button-container">
            <button 
              className="save-button" 
              onClick={saveUserProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="cancel-button" 
              onClick={() => cancelEditing('avatar')}
              disabled={isSavingProfile}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="edit-container" onClick={() => setEditingAvatar(true)}>
            Edit <img alt="" src={editIcon} />
          </div>
        )}
      </div>
    );
  });

  const ContactInformation = React.memo(() => {
    return (
      <div className="contact-information" ref={contactRef}>
        <div className="contact-information-header">
          <h1>Contact Information</h1>
          {editingContact ? (
            <div className="edit-button-container">
              <button 
                className="save-button" 
                onClick={saveContactInfo}
                disabled={isSavingContact}
              >
                {isSavingContact ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-button" 
                onClick={() => cancelEditing('contact')}
                disabled={isSavingContact}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="edit-container" onClick={() => setEditingContact(true)}>
              Edit <img alt="" src={editIcon} />
            </div>
          )}
        </div>

        <div className="contact-information-content">
          <div>
            <p>Contact information</p>
            {editingContact ? (
              <IsolatedInput
                name="contactNumber"
                placeholder="Phone number"
                initialValue={formData.contactNumber || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.contactNumber || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Alternate Sale Contact</p>
            {editingContact ? (
              <IsolatedInput
                name="alternateNumber1"
                placeholder="Alternative phone number"
                initialValue={formData.alternateNumber1 || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.alternateNumber1 || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Alternate Sale Contact</p>
            {editingContact ? (
              <IsolatedInput
                name="alternateNumber2"
                placeholder="Alternative phone number"
                initialValue={formData.alternateNumber2 || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.alternateNumber2 || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>

        <div className="contact-information-content">
          <div>
            <p>Primary Email</p>
            {user?.email || 'Not set'} <img alt="" src={verifiedIcon} />
          </div>
          <div>
            <p>Alternate Email</p>
            {editingContact ? (
              <IsolatedInput
                name="alternateEmail"
                placeholder="Alternative email"
                initialValue={formData.alternateEmail || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.alternateEmail || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>

        <div className="contact-information-content">
          <div>
            <p>Address</p>
            {editingContact ? (
              <div className="address-inputs">
                <IsolatedInput
                  name="address"
                  placeholder="Street address"
                  initialValue={formData.address || ''}
                  onBlur={handleInputBlur}
                  className="edit-input full-width"
                />
              </div>
            ) : (
              <>
                {userDetails?.address ? 
                  `${userDetails.address}` :
                  'Address not set'
                } <img alt="" src={verifiedIcon} />
              </>
            )}
          </div>
        </div>
      </div>
    );
  });

  // Company information section 
  const Companyinformation = React.memo(() => {
    return (
      <div className="contact-information" ref={companyRef}>
        <div className="contact-information-header">
          <h1>Company Information</h1>
          {editingCompany ? (
            <div className="edit-button-container">
              <button 
                className="save-button" 
                onClick={saveCompanyInfo}
                disabled={isSavingCompany}
              >
                {isSavingCompany ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-button"
                onClick={() => cancelEditing('company')}
                disabled={isSavingCompany}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="edit-container" onClick={() => setEditingCompany(true)}>
              Edit <img alt="" src={editIcon} />
            </div>
          )}
        </div>

        <div className="contact-information-content">
          <div>
            <p>Company Name</p>
            {editingCompany ? (
              <IsolatedInput
                name="companyName"
                placeholder="Company name"
                initialValue={formData.companyName || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.companyName || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Company Website</p>
            {editingCompany ? (
              <IsolatedInput
                name="companyWebsite"
                placeholder="Website URL"
                initialValue={formData.companyWebsite || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.companyWebsite || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>

        <div className="contact-information-content">
          <div>
            <p>Gstin</p>
            {editingCompany ? (
              <IsolatedInput
                name="gstin"
                placeholder="GSTIN"
                initialValue={formData.gstin || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.gstin || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Company address</p>
            {editingCompany ? (
              <IsolatedInput
                name="companyAddress"
                placeholder="Company address"
                initialValue={formData.companyAddress || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.companyAddress || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>

        <div className="contact-information-content">
          <div>
            <p>Socials</p>
            {editingCompany ? (
              <IsolatedInput
                name="socials"
                placeholder="Social media links"
                initialValue={formData.socials || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.socials || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>
      </div>
    );
  });

  // Bank details section
  const Bankdetails = React.memo(() => {
    return (
      <div className="contact-information" ref={bankRef}>
        <div className="contact-information-header">
          <h1>Bank Details</h1>
          {editingBank ? (
            <div className="edit-button-container">
              <button 
                className="save-button" 
                onClick={saveBankDetails}
                disabled={isSavingBank}
              >
                {isSavingBank ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-button" 
                onClick={() => cancelEditing('bank')}
                disabled={isSavingBank}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="edit-container" onClick={() => setEditingBank(true)}>
              Edit <img alt="" src={editIcon} />
            </div>
          )}
        </div>

        <div className="contact-information-content">
          <div>
            <p>IFSC Code</p>
            {editingBank ? (
              <IsolatedInput
                name="ifscCode"
                placeholder="IFSC Code"
                initialValue={formData.ifscCode || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.ifscCode || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Account Number</p>
            {editingBank ? (
              <IsolatedInput
                name="accountNumber"
                placeholder="Account Number"
                initialValue={formData.accountNumber || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.accountNumber || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>

        <div className="contact-information-content">
          <div>
            <p>Bank Name</p>
            {editingBank ? (
              <IsolatedInput
                name="bankName"
                placeholder="Bank Name"
                initialValue={formData.bankName || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.bankName || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
          <div>
            <p>Account type</p>
            {editingBank ? (
              <IsolatedInput
                name="accountType"
                placeholder="Account Type"
                initialValue={formData.accountType || ''}
                onBlur={handleInputBlur}
                className="edit-input"
              />
            ) : (
              <>{userDetails?.accountType || 'Not set'} <img alt="" src={verifiedIcon} /></>
            )}
          </div>
        </div>
      </div>
    );
  });

  // Add a stable memoized wrapper component for form sections
  const StableFormSection = React.memo(({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  });

  return (
    <>
      <SettingsLayout Body={
        <>
          <StableFormSection>
            <Useravatar />
          </StableFormSection>
          <StableFormSection>
            <ContactInformation />
          </StableFormSection>
          <StableFormSection>
            <Companyinformation />
          </StableFormSection>
          <StableFormSection>
            <Bankdetails />
          </StableFormSection>
        </>
      } />
      <ToastContainer position="bottom-right" aria-label="Notifications" />
    </>
  );
};

export default Settings;