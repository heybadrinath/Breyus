import React from "react";
import { Header, Leftnav } from "../seller/components";
import "../seller/css/settings.css"
import userProfile from "../seller/vectors/profile.svg";
import locationIcon from "../seller/vectors/location-icon.svg"
import editIcon from "../seller/vectors/edit.svg";
import verifiedIcon from "../seller/vectors/verified.svg";

// raw data
let city = "Vijayapur";
let state = "karnataka";
let username = "Demo User";
let country = "India";

// contact information
let contactNumber = 9999999999;
let alternateNumber = 8888888899;
let alternateNumber2 = 7777777777;
let userPrimaryMail = "user@example.com";
let userAlternateMail = "alternate@example.com";
let userAddress = "Example street 2nd main athani road " + city + ", " + state + " " + country + ".";

// Company information
let companyName = "Breyus";
let companyWebsite = "breyus.com";
let gst = "27AAAPA1234A1Z5";
let companyAddress = "Benguluru, Karnataka";
let Socials = "xx xx xx xx";

//Bank details
let accountType = "Current";
let bankName = "Karnataka vikas grameen bank";
let accountNumber = 48200485520;
let ifsc = "KVGB0003114";



// Ui components
const Useravatar = () => {
    return (
        <div id="user-avatar">
            <img src={userProfile} id="user-profile-picture" />
            <div id="user-profile-name-location">
                <h1>{username}</h1>
                <h1 id="location-container-h1"><img src={locationIcon} />{city + " " + state}</h1>
            </div>
            <div className="edit-container">
                Edit <img src={editIcon} />
            </div>
        </div>
    );
};



const ContactInformation = () => {
    return (
        <div className="contact-information" >

            <div className="contact-information-header">
                <h1>Contact Information</h1>
                <div className="edit-container">
                    Edit <img src={editIcon} />

                </div>
            </div>

            <div className="contact-information-content">
                <div><p>Contact information</p> {contactNumber} <img src={verifiedIcon} /></div>
                <div><p>Alternate Sale Contact</p> {alternateNumber} <img src={verifiedIcon} /></div>
                <div><p>Alternate Sale Contact</p> {alternateNumber2} <img src={verifiedIcon} /></div>
            </div>

            <div className="contact-information-content">
                <div><p>Primary Email</p> {userPrimaryMail} <img src={verifiedIcon} /></div>
                <div><p>Alternate Email</p> {userAlternateMail} <img src={verifiedIcon} /></div>
            </div>

            <div className="contact-information-content">
                <div>
                    <p>Address </p> {userAddress}
                    <img src={verifiedIcon} />
                </div>
            </div>

        </div>
    );
};



// Company information section 
const Companyinformation = () => {
    return (
        <div className="contact-information" >

            <div className="contact-information-header">
                <h1>Company Information</h1>
                <div className="edit-container">
                    Edit <img src={editIcon} />
                </div>
            </div>

            <div className="contact-information-content">
                <div><p>Company Name</p> {companyName} <img src={verifiedIcon} /></div>
                <div><p>Company Website</p> {companyWebsite} <img src={verifiedIcon} /></div>
            </div>

            <div className="contact-information-content">
                <div><p>Gstin</p> {gst} <img src={verifiedIcon} /></div>
                <div><p>Company address</p> {companyAddress} <img src={verifiedIcon} /></div>
            </div>

            <div className="contact-information-content">
                <div>
                    <p>Socials</p> {Socials}
                    <img src={verifiedIcon} />
                </div>
            </div>

        </div>
    );
};


// Bank details section
const Bankdetails = () => {
    return (
        <div className="contact-information" >

            <div className="contact-information-header">
                <h1>Bank Details</h1>
                <div className="edit-container">
                    Edit <img src={editIcon} />
                </div>
            </div>

            <div className="contact-information-content">
                <div><p>IFSC Code</p> {ifsc} <img src={verifiedIcon} /></div>
                <div><p>Account Number</p> {accountNumber} <img src={verifiedIcon} /></div>
            </div>

            <div className="contact-information-content">
                <div><p>Bank Name</p> {bankName} <img src={verifiedIcon} /></div>
                <div><p>Account type</p> {accountType} <img src={verifiedIcon} /></div>
            </div>
        </div>
    );
};


// settings page starting point 
const Settings = () => {
    return (
        <>
            <div id="settings-page">
                <Leftnav username={username} />
                <div id="right-section">
                    <Header />
                    <Useravatar />
                    <ContactInformation />
                    <Companyinformation/>
                    <Bankdetails/>
                </div>
            </div>




        </>
    );
};
export default Settings;