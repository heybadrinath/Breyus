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
        <div id="contact-information" >

            <div id="contact-information-header">
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
                </div>
            </div>




        </>
    );
};
export default Settings;