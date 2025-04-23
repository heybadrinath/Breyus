import React, { useState, useEffect } from "react";
import { SettingsLayout } from "../seller/components";
import "../seller/css/settings.css"
import userProfile from "../seller/vectors/profile.svg";
import locationIcon from "../seller/vectors/location-icon.svg"
import editIcon from "../seller/vectors/edit.svg";
import verifiedIcon from "../seller/vectors/verified.svg";
import authService from "../services/auth.service";
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
      </div>
    </div>
  );
};

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

export default Settings;