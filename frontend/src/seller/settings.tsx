<<<<<<< Updated upstream
import React, { useEffect, useState } from "react";
=======
import React, { useState, useEffect } from "react";
import { SettingsLayout } from "../seller/components";
>>>>>>> Stashed changes
import "../seller/css/settings.css"
import userProfile from "../seller/vectors/profile.svg";
import locationIcon from "../seller/vectors/location-icon.svg"
import editIcon from "../seller/vectors/edit.svg";
import verifiedIcon from "../seller/vectors/verified.svg";
import userDetailsService from "../services/user-details.service";
<<<<<<< Updated upstream

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
=======
import authService from "../services/auth.service";

// Define user details type
interface UserDetails {
  city: string;
  state: string;
  country: string;
  contactNumber: string;
  alternateNumber: string;
  alternateNumber2: string;
  primaryEmail: string;
  alternateEmail: string;
  address: string;
  companyName: string;
  companyWebsite: string;
  gst: string;
  companyAddress: string;
  socials: string;
  accountType: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
}

// Default user details
const defaultUserDetails: UserDetails = {
  city: "N/A",
  state: "N/A",
  country: "N/A",
  contactNumber: "N/A",
  alternateNumber: "N/A",
  alternateNumber2: "N/A",
  primaryEmail: "N/A",
  alternateEmail: "N/A",
  address: "N/A",
  companyName: "N/A",
  companyWebsite: "N/A",
  gst: "N/A",
  companyAddress: "N/A",
  socials: "N/A",
  accountType: "N/A",
  bankName: "N/A",
  accountNumber: "N/A",
  ifsc: "N/A"
};

// Ui components
const Useravatar = ({ userDetails, username }: { userDetails: UserDetails, username: string }) => {
>>>>>>> Stashed changes
  return (
    <div id="user-avatar">
      <img alt="" src={userProfile} id="user-profile-picture" />
      <div id="user-profile-name-location">
<<<<<<< Updated upstream
        <h1>{userData.firstName || 'User'} {userData.lastName || ''}</h1>
        <h1 id="location-container-h1">
          <img alt="" src={locationIcon} />
          {(userData.details?.city || PLACEHOLDER) + "   " + (userData.details?.state || "")}
=======
        <h1>{username}</h1>
        <h1 id="location-container-h1">
          <img alt="" src={locationIcon} />
          {userDetails.city + " " + userDetails.state}
>>>>>>> Stashed changes
        </h1>
      </div>
      <div className="edit-container">
        Edit <img alt="" src={editIcon} />
      </div>
    </div>
  );
};

<<<<<<< Updated upstream
const ContactInformation = ({ userData }: { userData: UserData }) => {
=======
const ContactInformation = ({ userDetails }: { userDetails: UserDetails }) => {
>>>>>>> Stashed changes
  return (
    <div className="contact-information" >
      <div className="contact-information-header">
        <h1>Contact Information</h1>
        <div className="edit-container">
          Edit <img alt="" src={editIcon} />
        </div>
      </div>

      <div className="contact-information-content">
<<<<<<< Updated upstream
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
=======
        <div><p>Contact information</p> {userDetails.contactNumber} <img alt="" src={verifiedIcon} /></div>
        <div><p>Alternate Sale Contact</p> {userDetails.alternateNumber} <img alt="" src={verifiedIcon} /></div>
        <div><p>Alternate Sale Contact</p> {userDetails.alternateNumber2} <img alt="" src={verifiedIcon} /></div>
      </div>

      <div className="contact-information-content">
        <div><p>Primary Email</p> {userDetails.primaryEmail} <img alt="" src={verifiedIcon} /></div>
        <div><p>Alternate Email</p> {userDetails.alternateEmail} <img alt="" src={verifiedIcon} /></div>
      </div>

      <div className="contact-information-content">
        <div>
          <p>Address </p> {userDetails.address}
          <img alt="" src={verifiedIcon} />
        </div>
      </div>
>>>>>>> Stashed changes
    </div>
  );
};

<<<<<<< Updated upstream
// Company information section 
const Companyinformation = ({ userData }: { userData: UserData }) => {
=======
const Companyinformation = ({ userDetails }: { userDetails: UserDetails }) => {
>>>>>>> Stashed changes
  return (
    <div className="contact-information" >
      <div className="contact-information-header">
        <h1>Company Information</h1>
        <div className="edit-container">
          Edit <img alt="" src={editIcon} />
        </div>
      </div>

      <div className="contact-information-content">
<<<<<<< Updated upstream
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
=======
        <div><p>Company Name</p> {userDetails.companyName} <img alt="" src={verifiedIcon} /></div>
        <div><p>Company Website</p> {userDetails.companyWebsite} <img alt="" src={verifiedIcon} /></div>
      </div>

      <div className="contact-information-content">
        <div><p>Gstin</p> {userDetails.gst} <img alt="" src={verifiedIcon} /></div>
        <div><p>Company address</p> {userDetails.companyAddress} <img alt="" src={verifiedIcon} /></div>
>>>>>>> Stashed changes
      </div>

      <div className="contact-information-content">
        <div>
<<<<<<< Updated upstream
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
=======
          <p>Socials</p> {userDetails.socials}
          <img alt="" src={verifiedIcon} />
        </div>
      </div>
>>>>>>> Stashed changes
    </div>
  );
};

<<<<<<< Updated upstream
// Bank details section
const Bankdetails = ({ userData }: { userData: UserData }) => {
=======
const Bankdetails = ({ userDetails }: { userDetails: UserDetails }) => {
>>>>>>> Stashed changes
  return (
    <div className="contact-information" >
      <div className="contact-information-header">
        <h1>Bank Details</h1>
        <div className="edit-container">
          Edit <img alt="" src={editIcon} />
        </div>
      </div>

      <div className="contact-information-content">
<<<<<<< Updated upstream
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
=======
        <div><p>IFSC Code</p> {userDetails.ifsc} <img alt="" src={verifiedIcon} /></div>
        <div><p>Account Number</p> {userDetails.accountNumber} <img alt="" src={verifiedIcon} /></div>
      </div>

      <div className="contact-information-content">
        <div><p>Bank Name</p> {userDetails.bankName} <img alt="" src={verifiedIcon} /></div>
        <div><p>Account type</p> {userDetails.accountType} <img alt="" src={verifiedIcon} /></div>
>>>>>>> Stashed changes
      </div>
    </div>
  );
};

// settings page starting point 
const Settings = () => {
<<<<<<< Updated upstream
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
=======
  const [userDetails, setUserDetails] = useState<UserDetails>(defaultUserDetails);
  const [username, setUsername] = useState<string>("User");

  useEffect(() => {
    // Get current user from auth service immediately
    const user = authService.getUser();
    if (user && user.firstName) {
      setUsername(user.firstName + (user.lastName ? " " + user.lastName : ""));
    }
    
    // Fetch user details from service
    const fetchUserDetails = async () => {
      try {
        const details = await userDetailsService.getUserDetails();
        
        if (details) {
          setUserDetails({
            city: details.city || "N/A",
            state: details.state || "N/A",
            country: details.country || "N/A",
            contactNumber: details.contactNumber || "N/A",
            alternateNumber: details.alternateNumber || "N/A",
            alternateNumber2: details.alternateNumber2 || "N/A",
            primaryEmail: details.primaryEmail || user?.email || "N/A",
            alternateEmail: details.alternateEmail || "N/A",
            address: details.address || 
                    `${details.street || ""} ${details.city || ""}, ${details.state || ""} ${details.country || ""}`.trim() || 
                    "N/A",
            companyName: details.companyName || "N/A",
            companyWebsite: details.companyWebsite || "N/A",
            gst: details.gst || "N/A",
            companyAddress: details.companyAddress || "N/A",
            socials: details.socials || "N/A",
            accountType: details.accountType || "N/A",
            bankName: details.bankName || "N/A",
            accountNumber: details.accountNumber || "N/A",
            ifsc: details.ifsc || "N/A"
          });
        } else {
          // If no details found, use default N/A values but show user's email if available
          const updatedDetails = { ...defaultUserDetails };
          if (user) {
            updatedDetails.primaryEmail = user.email || "N/A";
          }
          setUserDetails(updatedDetails);
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        // On error, silently use the default N/A values
      }
    };

    fetchUserDetails();
  }, []);

  return (
    <SettingsLayout Body={
      <>
        <Useravatar userDetails={userDetails} username={username} />
        <ContactInformation userDetails={userDetails} />
        <Companyinformation userDetails={userDetails} />
        <Bankdetails userDetails={userDetails} />
      </>
    } />
>>>>>>> Stashed changes
  );
};

export default Settings;