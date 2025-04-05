import React, { useEffect, useState } from "react";
import "../seller/css/settings.css"
import userProfile from "../seller/vectors/profile.svg";
import locationIcon from "../seller/vectors/location-icon.svg"
import editIcon from "../seller/vectors/edit.svg";
import verifiedIcon from "../seller/vectors/verified.svg";
import userDetailsService from "../services/user-details.service";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  details?: {
    // Contact Information
    contactNumber?: string;
    alternateNumber1?: string;
    alternateNumber2?: string;
    alternateEmail?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;

    // Company Information
    companyName?: string;
    companyWebsite?: string;
    gstin?: string;
    companyAddress?: string;
    socials?: string;

    // Bank Details
    accountType?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
}

// Placeholder message for empty fields
const PLACEHOLDER = "Enter your data";

// Ui components
const Useravatar = ({ userData }: { userData: UserData }) => {
  return (
    <div id="user-avatar">
      <img alt="" src={userProfile} id="user-profile-picture" />
      <div id="user-profile-name-location">
        <h1>{userData.firstName || 'User'} {userData.lastName || ''}</h1>
        <h1 id="location-container-h1">
          <img alt="" src={locationIcon} />
          {(userData.details?.city || PLACEHOLDER) + "   " + (userData.details?.state || "")}
        </h1>
      </div>
      <div className="edit-container">
        Edit <img alt="" src={editIcon} />
      </div>
    </div>
  );
};

const ContactInformation = ({ userData }: { userData: UserData }) => {
  return (
    <div className="contact-information" >
      <div className="contact-information-header">
        <h1>Contact Information</h1>
        <div className="edit-container">
          Edit <img alt="" src={editIcon} />
        </div>
      </div>

      <div className="contact-information-content">
        <div>
          <p>Contact information</p> 
          {userData.details?.contactNumber || PLACEHOLDER} 
          {userData.details?.contactNumber && <img alt="" src={verifiedIcon} />}
        </div>
        <div>
          <p>Alternate Sale Contact</p> 
          {userData.details?.alternateNumber1 || PLACEHOLDER} 
          {userData.details?.alternateNumber1 && <img alt="" src={verifiedIcon} />}
        </div>
        <div>
          <p>Alternate Sale Contact</p> 
          {userData.details?.alternateNumber2 || PLACEHOLDER} 
          {userData.details?.alternateNumber2 && <img alt="" src={verifiedIcon} />}
        </div>
      </div>

      <div className="contact-information-content">
        <div>
          <p>Primary Email</p> 
          {userData.email || PLACEHOLDER} 
          {userData.email && <img alt="" src={verifiedIcon} />}
        </div>
        <div>
          <p>Alternate Email</p> 
          {userData.details?.alternateEmail || PLACEHOLDER} 
          {userData.details?.alternateEmail && <img alt="" src={verifiedIcon} />}
        </div>
      </div>

      <div className="contact-information-content">
        <div>
          <p>Address </p> 
          {userData.details?.address || PLACEHOLDER}
          {userData.details?.address && <img alt="" src={verifiedIcon} />}
        </div>
      </div>
    </div>
  );
};

// Company information section 
const Companyinformation = ({ userData }: { userData: UserData }) => {
  return (
    <div className="contact-information" >
      <div className="contact-information-header">
        <h1>Company Information</h1>
        <div className="edit-container">
          Edit <img alt="" src={editIcon} />
        </div>
      </div>

      <div className="contact-information-content">
        <div>
          <p>Company Name</p> 
          {userData.details?.companyName || PLACEHOLDER} 
          {userData.details?.companyName && <img alt="" src={verifiedIcon} />}
        </div>
        <div>
          <p>Company Website</p> 
          {userData.details?.companyWebsite || PLACEHOLDER} 
          {userData.details?.companyWebsite && <img alt="" src={verifiedIcon} />}
        </div>
      </div>

      <div className="contact-information-content">
        <div>
          <p>Gstin</p> 
          {userData.details?.gstin || PLACEHOLDER} 
          {userData.details?.gstin && <img alt="" src={verifiedIcon} />}
        </div>
        <div>
          <p>Company address</p> 
          {userData.details?.companyAddress || PLACEHOLDER} 
          {userData.details?.companyAddress && <img alt="" src={verifiedIcon} />}
        </div>
      </div>

      <div className="contact-information-content">
        <div>
          <p>Socials</p> 
          {userData.details?.socials || PLACEHOLDER}
          {userData.details?.socials && <img alt="" src={verifiedIcon} />}
        </div>
      </div>
    </div>
  );
};

// Bank details section
const Bankdetails = ({ userData }: { userData: UserData }) => {
  return (
    <div className="contact-information" >
      <div className="contact-information-header">
        <h1>Bank Details</h1>
        <div className="edit-container">
          Edit <img alt="" src={editIcon} />
        </div>
      </div>

      <div className="contact-information-content">
        <div>
          <p>IFSC Code</p> 
          {userData.details?.ifscCode || PLACEHOLDER} 
          {userData.details?.ifscCode && <img alt="" src={verifiedIcon} />}
        </div>
        <div>
          <p>Account Number</p> 
          {userData.details?.accountNumber || PLACEHOLDER} 
          {userData.details?.accountNumber && <img alt="" src={verifiedIcon} />}
        </div>
      </div>

      <div className="contact-information-content">
        <div>
          <p>Bank Name</p> 
          {userData.details?.bankName || PLACEHOLDER} 
          {userData.details?.bankName && <img alt="" src={verifiedIcon} />}
        </div>
        <div>
          <p>Account type</p> 
          {userData.details?.accountType || PLACEHOLDER} 
          {userData.details?.accountType && <img alt="" src={verifiedIcon} />}
        </div>
      </div>
    </div>
  );
};

// settings page starting point 
const Settings = () => {
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get basic user info from localStorage
        const userStr = localStorage.getItem('user');
        const localUser = userStr ? JSON.parse(userStr) : null;
        
        if (!localUser) {
          setError('User not found in localStorage');
          setLoading(false);
          return;
        }
        
        // Set basic user info
        setUserData({
          firstName: localUser.firstName || '',
          lastName: localUser.lastName || '',
          email: localUser.email || ''
        });
        
        // Fetch detailed user info from API
        const userDetails = await userDetailsService.getUserDetails();
        
        if (userDetails) {
          setUserData(prevData => ({
            ...prevData,
            details: userDetails.details
          }));
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Loading user data...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }
    
  return (
    <div className="container mx-auto p-4">
      <Useravatar userData={userData} />
      <ContactInformation userData={userData} />
      <Companyinformation userData={userData} />
      <Bankdetails userData={userData} />
    </div>
  );
};

export default Settings;