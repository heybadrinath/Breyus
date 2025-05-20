import React, { useState, useEffect } from "react";
import { SettingsLayout } from "../seller/components";
import "../seller/css/settings.css"
import userProfile from "../seller/vectors/profile.svg";
import locationIcon from "../seller/vectors/location-icon.svg"
import editIcon from "../seller/vectors/edit.svg";
import verifiedIcon from "../seller/vectors/verified.svg";
import authService from "../services/auth.service";
<<<<<<< Updated upstream
import apiService from "../services/api.service";

// User details interface
interface UserDetails {
  contactNumber?: string;
  alternateNumber1?: string;
  alternateNumber2?: string;
  alternateEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  companyName?: string;
  companyWebsite?: string;
  gstin?: string;
  companyAddress?: string;
  socials?: string;
  accountType?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

// Ui components
const Useravatar = ({ firstName, lastName, city, state }: { firstName: string, lastName: string, city: string, state: string }) => {
  const displayName = `${firstName || ''} ${lastName || ''}`.trim() || 'N/A';
  const location = `${city || ''} ${state || ''}`.trim() || 'N/A';
  
  return (
    <div id="user-avatar">
      <img alt="" src={userProfile} id="user-profile-picture" />
      <div id="user-profile-name-location">
        <h1>{displayName}</h1>
        <h1 id="location-container-h1"><img alt="" src={locationIcon} />{location}</h1>
      </div>
      <div className="edit-container">
        Edit <img alt="" src={editIcon} />
=======
import userDetailsService from "../services/user-details.service";

// Interface for the EditableField component props
interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
}

// Component to handle editing fields
const EditableField: React.FC<EditableFieldProps> = ({ label, value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      setError("Failed to save. Please try again.");
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return isEditing ? (
    <div className="editable-field-container">
      <p>{label}</p>
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="editable-field-input"
        autoFocus
      />
      {error && <div className="error-message">{error}</div>}
      <div className="editable-field-actions">
        <button onClick={handleSave} className="save-btn" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button onClick={() => {
          setIsEditing(false);
          setError("");
        }} className="cancel-btn" disabled={isSaving}>
          Cancel
        </button>
>>>>>>> Stashed changes
      </div>
    </div>
  ) : (
    <div onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>
      <p>{label}</p> {value || "N/A"} {value && <img alt="" src={verifiedIcon} />}
    </div>
  );
};

<<<<<<< Updated upstream
const ContactInformation = ({ userDetails }: { userDetails: UserDetails }) => {
  return (
    <div className="contact-information" >

      <div className="contact-information-header">
        <h1>Contact Information</h1>
        <div className="edit-container">
          Edit <img alt="" src={editIcon} />
        </div>
      </div>

      <div className="contact-information-content">
        <div><p>Contact Number</p> {userDetails.contactNumber || 'N/A'} <img alt="" src={verifiedIcon} /></div>
        <div><p>Alternate Sale Contact</p> {userDetails.alternateNumber1 || 'N/A'} <img alt="" src={verifiedIcon} /></div>
        <div><p>Alternate Sale Contact</p> {userDetails.alternateNumber2 || 'N/A'} <img alt="" src={verifiedIcon} /></div>
      </div>

      <div className="contact-information-content">
        <div><p>Primary Email</p> {authService.getUser()?.email || 'N/A'} <img alt="" src={verifiedIcon} /></div>
        <div><p>Alternate Email</p> {userDetails.alternateEmail || 'N/A'} <img alt="" src={verifiedIcon} /></div>
      </div>

      <div className="contact-information-content">
        <div>
          <p>Address</p> {userDetails.address || 'N/A'}
          <img alt="" src={verifiedIcon} />
        </div>
      </div>
    </div>
  );
};

// Company information section 
const Companyinformation = ({ userDetails }: { userDetails: UserDetails }) => {
  return (
    <div className="contact-information" >

      <div className="contact-information-header">
        <h1>Company Information</h1>
        <div className="edit-container">
          Edit <img alt="" src={editIcon} />
        </div>
      </div>

      <div className="contact-information-content">
        <div><p>Company Name</p> {userDetails.companyName || 'N/A'} <img alt="" src={verifiedIcon} /></div>
        <div><p>Company Website</p> {userDetails.companyWebsite || 'N/A'} <img alt="" src={verifiedIcon} /></div>
      </div>

      <div className="contact-information-content">
        <div><p>GSTIN</p> {userDetails.gstin || 'N/A'} <img alt="" src={verifiedIcon} /></div>
        <div><p>Company address</p> {userDetails.companyAddress || 'N/A'} <img alt="" src={verifiedIcon} /></div>
      </div>

      <div className="contact-information-content">
        <div>
          <p>Socials</p> {userDetails.socials || 'N/A'}
          <img alt="" src={verifiedIcon} />
        </div>
      </div>
    </div>
  );
};

// Bank details section
const Bankdetails = ({ userDetails }: { userDetails: UserDetails }) => {
  return (
    <div className="contact-information" >

      <div className="contact-information-header">
        <h1>Bank Details</h1>
        <div className="edit-container">
          Edit <img alt="" src={editIcon} />
        </div>
      </div>

      <div className="contact-information-content">
        <div><p>IFSC Code</p> {userDetails.ifscCode || 'N/A'} <img alt="" src={verifiedIcon} /></div>
        <div><p>Account Number</p> {userDetails.accountNumber || 'N/A'} <img alt="" src={verifiedIcon} /></div>
      </div>

      <div className="contact-information-content">
        <div><p>Bank Name</p> {userDetails.bankName || 'N/A'} <img alt="" src={verifiedIcon} /></div>
        <div><p>Account type</p> {userDetails.accountType || 'N/A'} <img alt="" src={verifiedIcon} /></div>
      </div>
    </div>
  );
};

// settings page starting point 
const Settings = () => {
  const [userDetails, setUserDetails] = useState<UserDetails>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  
  // Check authentication state on component mount
  useEffect(() => {
    const isUserAuthenticated = authService.isAuthenticated();
    setAuthenticated(isUserAuthenticated);
    
    // If not authenticated, set appropriate error message and stop loading
    if (!isUserAuthenticated) {
      setLoading(false);
      setError('User not authenticated. Please log in first.');
      return;
    }

    const user = authService.getUser();
    // If authenticated but no user data, try to validate token with backend
    if (isUserAuthenticated && (!user || !user.id)) {
      authService.validateTokenWithBackend()
        .then(isValid => {
          if (!isValid) {
            setAuthenticated(false);
            setError('Session expired. Please log in again.');
            setLoading(false);
          } else {
            fetchUserDetails(); // Token validated, now fetch user details
          }
        })
        .catch(err => {
          console.error('Error validating token:', err);
          setAuthenticated(false);
          setError('Error validating your session. Please log in again.');
          setLoading(false);
        });
    } else if (user && user.id) {
      // User is authenticated and has ID, fetch details
      fetchUserDetails();
    }
  }, []); // Run only once on component mount
  
  // Separate function to fetch user details
  const fetchUserDetails = async () => {
    const user = authService.getUser();
    if (!user || !user.id) {
      setLoading(false);
      setError('User data not found. Please log in again.');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiService.users.getDetails(user.id);
      if (response && response.data) {
        setUserDetails(response.data || {});
        setLoading(false);
      } else {
        // Handle case where response exists but no data
        setUserDetails({});
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details. Please try again later.');
      setLoading(false);
    }
  };

  if (loading) {
    return <SettingsLayout Body={<div className="p-4 text-center">Loading user details...</div>} />;
  }

  if (error) {
    return <SettingsLayout Body={
      <div className="p-4 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        {!authenticated && (
          <div>
            <p>You need to be logged in to view this page.</p>
            <button 
              onClick={() => window.location.href = '/seller/signin'} 
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    } />;
  }

  const user = authService.getUser() || {};
  
  return (
    <SettingsLayout Body={
      <>
        <Useravatar 
          firstName={user.firstName || ''} 
          lastName={user.lastName || ''} 
          city={userDetails.city || ''} 
          state={userDetails.state || ''} 
        />
        <ContactInformation userDetails={userDetails} />
        <Companyinformation userDetails={userDetails} />
        <Bankdetails userDetails={userDetails} />
      </>
    } />
  );
};

=======
// Types for user data and user details
interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}

interface UserDetails {
  city: string;
  state: string;
  country: string;
  contactNumber: string;
  alternateNumber1: string;
  alternateNumber2: string;
  alternateEmail: string;
  address: string;
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

// Main Settings component
const Settings: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [userDetails, setUserDetails] = useState<UserDetails>({
    city: "",
    state: "",
    country: "",
    contactNumber: "",
    alternateNumber1: "",
    alternateNumber2: "",
    alternateEmail: "",
    address: "",
    companyName: "",
    companyWebsite: "",
    gstin: "",
    companyAddress: "",
    socials: "",
    accountType: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load user data from JWT and database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      
      try {
        // Get user from JWT
        const user = authService.getUser();
        if (user) {
          setUserData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
          });
        } else {
          throw new Error("User not authenticated");
        }

        // Fetch user details from database
        const details = await userDetailsService.getUserDetails();
        if (details) {
          setUserDetails({
            city: details.city || "",
            state: details.state || "",
            country: details.country || "",
            contactNumber: details.contactNumber || "",
            alternateNumber1: details.alternateNumber1 || "",
            alternateNumber2: details.alternateNumber2 || "",
            alternateEmail: details.alternateEmail || "",
            address: details.address || "",
            companyName: details.companyName || "",
            companyWebsite: details.companyWebsite || "",
            gstin: details.gstin || "",
            companyAddress: details.companyAddress || "",
            socials: details.socials || "",
            accountType: details.accountType || "",
            bankName: details.bankName || "",
            accountNumber: details.accountNumber || "",
            ifscCode: details.ifscCode || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setError("Failed to load user data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update user details in the database
  const updateUserDetail = async (field: keyof UserDetails, value: string) => {
    try {
      // First update locally for immediate feedback
      const updatedDetails = { ...userDetails, [field]: value };
      setUserDetails(updatedDetails);
      
      // Then update in the backend
      await userDetailsService.updateUserDetails({ [field]: value });
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      // Revert changes on error and re-throw for the component to handle
      setUserDetails(prevDetails => ({ ...prevDetails }));
      throw error;
    }
  };

  // UI components
  const Useravatar = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(`${userData.firstName} ${userData.lastName}`.trim() || "");
    const [editCity, setEditCity] = useState(userDetails.city);
    const [editState, setEditState] = useState(userDetails.state);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
      try {
        setIsSaving(true);
        setError("");
        
        // Split name into first and last name
        const nameParts = editName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Update multiple fields at once for efficiency
        const updatedFields = {
          city: editCity,
          state: editState
        };

        // Update in the backend
        await userDetailsService.updateMultipleDetails(updatedFields);

        // Update local state on success
        setUserDetails(prev => ({
          ...prev,
          ...updatedFields
        }));

        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update profile:", error);
        setError("Failed to update profile. Please try again.");
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div id="user-avatar">
        <img alt="" src={userProfile} id="user-profile-picture" />
        {isEditing ? (
          <div id="user-profile-edit">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Full Name"
              autoFocus
            />
            <div className="location-edit">
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="City"
              />
              <input
                type="text"
                value={editState}
                onChange={(e) => setEditState(e.target.value)}
                placeholder="State"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="edit-actions">
              <button onClick={handleSave} className="save-btn" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => {
                setIsEditing(false);
                setError("");
              }} className="cancel-btn" disabled={isSaving}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div id="user-profile-name-location">
              <h1>{`${userData.firstName} ${userData.lastName}`.trim() || "N/A"}</h1>
              <h1 id="location-container-h1">
                <img alt="" src={locationIcon} />
                {(userDetails.city || userDetails.state) ? 
                  `${userDetails.city || "N/A"} ${userDetails.state || "N/A"}` : 
                  "N/A"}
              </h1>
            </div>
            <div className="edit-container" onClick={() => setIsEditing(true)}>
              Edit <img alt="" src={editIcon} />
            </div>
          </>
        )}
      </div>
    );
  };

  const ContactInformation = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [showHelpMessage, setShowHelpMessage] = useState(false);

    const handleEditClick = () => {
      setIsEditing(true);
      setShowHelpMessage(true);
      // Hide the help message after 5 seconds
      setTimeout(() => setShowHelpMessage(false), 5000);
    };

    return (
      <div className={`contact-information ${isEditing ? 'editable-mode' : ''}`}>
        <div className="contact-information-header">
          <h1>Contact Information</h1>
          {!isEditing ? (
            <div className="edit-container" onClick={handleEditClick}>
              Edit <img alt="" src={editIcon} />
            </div>
          ) : (
            <div className="edit-container cancel" onClick={() => {
              setIsEditing(false);
              setShowHelpMessage(false);
            }}>
              Cancel
            </div>
          )}
        </div>

        {showHelpMessage && (
          <div className="edit-help-message">
            Click on the field you want to edit
          </div>
        )}

        <div className="contact-information-content">
          {isEditing ? (
            <>
              <EditableField 
                label="Contact information" 
                value={userDetails.contactNumber} 
                onSave={(value: string) => updateUserDetail('contactNumber', value)} 
              />
              <EditableField 
                label="Alternate Sale Contact" 
                value={userDetails.alternateNumber1} 
                onSave={(value: string) => updateUserDetail('alternateNumber1', value)} 
              />
              <EditableField 
                label="Alternate Sale Contact" 
                value={userDetails.alternateNumber2} 
                onSave={(value: string) => updateUserDetail('alternateNumber2', value)} 
              />
            </>
          ) : (
            <>
              <div>
                <p>Contact information</p> {userDetails.contactNumber || "N/A"} 
                {userDetails.contactNumber && <img alt="" src={verifiedIcon} />}
              </div>
              <div>
                <p>Alternate Sale Contact</p> {userDetails.alternateNumber1 || "N/A"} 
                {userDetails.alternateNumber1 && <img alt="" src={verifiedIcon} />}
              </div>
              <div>
                <p>Alternate Sale Contact</p> {userDetails.alternateNumber2 || "N/A"} 
                {userDetails.alternateNumber2 && <img alt="" src={verifiedIcon} />}
              </div>
            </>
          )}
        </div>

        <div className="contact-information-content">
          {isEditing ? (
            <>
              <EditableField 
                label="Primary Email" 
                value={userData.email} 
                onSave={(value: string) => {}} // Primary email can't be changed here
              />
              <EditableField 
                label="Alternate Email" 
                value={userDetails.alternateEmail} 
                onSave={(value: string) => updateUserDetail('alternateEmail', value)} 
              />
            </>
          ) : (
            <>
              <div>
                <p>Primary Email</p> {userData.email || "N/A"} 
                {userData.email && <img alt="" src={verifiedIcon} />}
              </div>
              <div>
                <p>Alternate Email</p> {userDetails.alternateEmail || "N/A"} 
                {userDetails.alternateEmail && <img alt="" src={verifiedIcon} />}
              </div>
            </>
          )}
        </div>

        <div className="contact-information-content">
          {isEditing ? (
            <EditableField 
              label="Address" 
              value={userDetails.address} 
              onSave={(value: string) => updateUserDetail('address', value)} 
            />
          ) : (
            <div>
              <p>Address </p> {userDetails.address || "N/A"}
              {userDetails.address && <img alt="" src={verifiedIcon} />}
            </div>
          )}
        </div>
      </div>
    );
  };

  const Companyinformation = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [showHelpMessage, setShowHelpMessage] = useState(false);

    const handleEditClick = () => {
      setIsEditing(true);
      setShowHelpMessage(true);
      // Hide the help message after 5 seconds
      setTimeout(() => setShowHelpMessage(false), 5000);
    };

    return (
      <div className={`contact-information ${isEditing ? 'editable-mode' : ''}`}>
        <div className="contact-information-header">
          <h1>Company Information</h1>
          {!isEditing ? (
            <div className="edit-container" onClick={handleEditClick}>
              Edit <img alt="" src={editIcon} />
            </div>
          ) : (
            <div className="edit-container cancel" onClick={() => {
              setIsEditing(false);
              setShowHelpMessage(false);
            }}>
              Cancel
            </div>
          )}
        </div>

        {showHelpMessage && (
          <div className="edit-help-message">
            Click on the field you want to edit
          </div>
        )}

        <div className="contact-information-content">
          {isEditing ? (
            <>
              <EditableField 
                label="Company Name" 
                value={userDetails.companyName} 
                onSave={(value: string) => updateUserDetail('companyName', value)} 
              />
              <EditableField 
                label="Company Website" 
                value={userDetails.companyWebsite} 
                onSave={(value: string) => updateUserDetail('companyWebsite', value)} 
              />
            </>
          ) : (
            <>
              <div>
                <p>Company Name</p> {userDetails.companyName || "N/A"} 
                {userDetails.companyName && <img alt="" src={verifiedIcon} />}
              </div>
              <div>
                <p>Company Website</p> {userDetails.companyWebsite || "N/A"} 
                {userDetails.companyWebsite && <img alt="" src={verifiedIcon} />}
              </div>
            </>
          )}
        </div>

        <div className="contact-information-content">
          {isEditing ? (
            <>
              <EditableField 
                label="Gstin" 
                value={userDetails.gstin} 
                onSave={(value: string) => updateUserDetail('gstin', value)} 
              />
              <EditableField 
                label="Company address" 
                value={userDetails.companyAddress} 
                onSave={(value: string) => updateUserDetail('companyAddress', value)} 
              />
            </>
          ) : (
            <>
              <div>
                <p>Gstin</p> {userDetails.gstin || "N/A"} 
                {userDetails.gstin && <img alt="" src={verifiedIcon} />}
              </div>
              <div>
                <p>Company address</p> {userDetails.companyAddress || "N/A"} 
                {userDetails.companyAddress && <img alt="" src={verifiedIcon} />}
              </div>
            </>
          )}
        </div>

        <div className="contact-information-content">
          {isEditing ? (
            <EditableField 
              label="Socials" 
              value={userDetails.socials} 
              onSave={(value: string) => updateUserDetail('socials', value)} 
            />
          ) : (
            <div>
              <p>Socials</p> {userDetails.socials || "N/A"}
              {userDetails.socials && <img alt="" src={verifiedIcon} />}
            </div>
          )}
        </div>
      </div>
    );
  };

  const Bankdetails = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [showHelpMessage, setShowHelpMessage] = useState(false);

    const handleEditClick = () => {
      setIsEditing(true);
      setShowHelpMessage(true);
      // Hide the help message after 5 seconds
      setTimeout(() => setShowHelpMessage(false), 5000);
    };

    return (
      <div className={`contact-information ${isEditing ? 'editable-mode' : ''}`}>
        <div className="contact-information-header">
          <h1>Bank Details</h1>
          {!isEditing ? (
            <div className="edit-container" onClick={handleEditClick}>
              Edit <img alt="" src={editIcon} />
            </div>
          ) : (
            <div className="edit-container cancel" onClick={() => {
              setIsEditing(false);
              setShowHelpMessage(false);
            }}>
              Cancel
            </div>
          )}
        </div>

        {showHelpMessage && (
          <div className="edit-help-message">
            Click on the field you want to edit
          </div>
        )}

        <div className="contact-information-content">
          {isEditing ? (
            <>
              <EditableField 
                label="IFSC Code" 
                value={userDetails.ifscCode} 
                onSave={(value: string) => updateUserDetail('ifscCode', value)} 
              />
              <EditableField 
                label="Account Number" 
                value={userDetails.accountNumber} 
                onSave={(value: string) => updateUserDetail('accountNumber', value)} 
              />
            </>
          ) : (
            <>
              <div>
                <p>IFSC Code</p> {userDetails.ifscCode || "N/A"} 
                {userDetails.ifscCode && <img alt="" src={verifiedIcon} />}
              </div>
              <div>
                <p>Account Number</p> {userDetails.accountNumber || "N/A"} 
                {userDetails.accountNumber && <img alt="" src={verifiedIcon} />}
              </div>
            </>
          )}
        </div>

        <div className="contact-information-content">
          {isEditing ? (
            <>
              <EditableField 
                label="Bank Name" 
                value={userDetails.bankName} 
                onSave={(value: string) => updateUserDetail('bankName', value)} 
              />
              <EditableField 
                label="Account type" 
                value={userDetails.accountType} 
                onSave={(value: string) => updateUserDetail('accountType', value)} 
              />
            </>
          ) : (
            <>
              <div>
                <p>Bank Name</p> {userDetails.bankName || "N/A"} 
                {userDetails.bankName && <img alt="" src={verifiedIcon} />}
              </div>
              <div>
                <p>Account type</p> {userDetails.accountType || "N/A"} 
                {userDetails.accountType && <img alt="" src={verifiedIcon} />}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <SettingsLayout
      Body={
        <>
          <Useravatar />
          <ContactInformation />
          <Companyinformation />
          <Bankdetails />
        </>
      }
    />
  );
};

>>>>>>> Stashed changes
export default Settings;