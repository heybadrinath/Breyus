import { X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { Address as AddressType } from "../../services/trade.service";

interface AddressProps {
    handlestep: (step: number) => void;
    currentStep: number;
    onDataChange: (data: any) => void;
    stepData: any;
    // Lifted state props
    addresses: AddressType[];
    selectedAddressIndex: number;
    onAddressesChange: (addresses: AddressType[]) => void;
    showAddAddressPopup: boolean;
    onShowAddAddressPopupChange: (show: boolean) => void;
    newAddress: AddressType;
    onNewAddressChange: (address: AddressType) => void;
    onAddNewAddress: () => void;
    onSelectedAddressIndexChange: (index: number) => void;
    loading?: boolean;
}

export const Address: React.FC<AddressProps> = ({ 
    handlestep, 
    currentStep, 
    onDataChange, 
    stepData,
    addresses,
    selectedAddressIndex,
    onAddressesChange,
    showAddAddressPopup,
    onShowAddAddressPopupChange,
    newAddress,
    onNewAddressChange,
    onAddNewAddress,
    onSelectedAddressIndexChange,
    loading = false
}) => {
    const handleAddAddressClick = () => {
        onShowAddAddressPopupChange(true);
    };

    const handleClosePopup = () => {
        onShowAddAddressPopupChange(false);
        // Reset form
        onNewAddressChange({
            fullName: '',
            mobileNumber: '',
            pincode: '',
            streetName: '',
            landmark: '',
            city: '',
            state: '',
            country: 'India',
            additionalDetails: ''
        });
    };

    const handleSaveAddress = () => {
        // Validate required fields
        if (!newAddress.fullName || !newAddress.mobileNumber || !newAddress.pincode || 
            !newAddress.streetName || !newAddress.city || !newAddress.state) {
            alert('Please fill in all required fields');
            return;
        }

        onAddNewAddress();
    };

    const handleAddressSelection = (index: number) => {
        onSelectedAddressIndexChange(index);
    };

    const handleNext = () => {
        if (addresses.length === 0) {
            alert('Please add at least one address');
            return;
        }
        handlestep(currentStep + 1);
    };

    return (
        <div className="flex flex-col h-[80%] my-auto mx-auto w-[50%]">
            <h1 className="text-3xl font-semibold text-black mb-3">Delivery Address</h1>
            <div className="flex flex-col w-full h-[90%] border-2 rounded-lg px-8 py-6 gap-y-4" >
                <div className="flex flex-col h-full overflow-y-scroll border-2 rounded-lg py-8 px-8 gap-y-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading addresses...</p>
                        </div>
                    ) : (addresses && addresses.length > 0) ? addresses.map((address, index) => (
                        <div key={index} className="flex w-full border p-6 rounded-lg">
                            <input
                                type="radio"
                                name="addressOption"
                                className="form-radio h-5 w-5 text-black mt-2 mr-6"
                                checked={selectedAddressIndex === index}
                                onChange={() => handleAddressSelection(index)}
                            />
                            <div className="flex flex-col">
                                <div className="flex">
                                    <label className="font-medium text-2xl inline">
                                        Delivering to {address.fullName}
                                    </label>
                                </div>
                                <div className="p-2 mt-2 w-[80%] text-wrap">
                                    {address.streetName}, {address.landmark && `${address.landmark}, `}
                                    {address.city}, {address.state} {address.country} - {address.pincode}
                                    {address.additionalDetails && `, ${address.additionalDetails}`}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    Mobile: {address.mobileNumber}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-2xl font-semibold text-gray-500">Add Your Delivery address</div>
                    )}
                </div>

                <button 
                    onClick={handleAddAddressClick} 
                    className="text-lg font-bold w-full py-2 px-3 rounded-lg text-left text-red-500 mb-4 border-2"
                > 
                    <Plus className="inline my-auto w-5 h-5" /> Add new Address 
                </button>

                <div className="flex justify-between mt-auto">
                    <button
                        onClick={() => handlestep(currentStep - 1)}
                        type="button"
                        className=" bg-gradient-to-r from-[#e7e7e7] to-[#ffffff] border-2 text-black px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-[#e1e2e4] hover:to-[#f8fafc] hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNext}
                        type="button"
                        className=" ml-auto bg-gradient-to-r from-[#5e5959] to-[black] text-white px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-gray-600 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Add new address popup  */}
            <AnimatePresence>
                {showAddAddressPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
                    >
                        <motion.div
                            initial={{ y: "-100vh", opacity: 0 }}
                            animate={{ y: "0", opacity: 1 }}
                            exit={{ y: "100vh", opacity: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 relative flex flex-col"
                        >
                            <button onClick={handleClosePopup} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" aria-label="Close"> <X size={22} /> </button>
                            <h2 className="text-xl font-bold mb-4 text-center">Add new Address</h2>
                            <div className="space-y-3 text-sm flex flex-col">
                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium" htmlFor="country">Country/Region</label>
                                    <select 
                                        id="country" 
                                        className="w-full px-2 py-3 bg-white border-2 rounded-lg cursor-pointer"
                                        value={newAddress.country}
                                        onChange={(e) => onNewAddressChange({...newAddress, country: e.target.value})}
                                    >
                                        <option value="India">India</option>
                                        <option value="USA">USA</option>
                                        <option value="UK">UK</option>
                                        <option value="UAE">UAE</option>
                                        <option value="Australia">Australia</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Germany">Germany</option>
                                        <option value="France">France</option>
                                        <option value="Italy">Italy</option>
                                        <option value="Spain">Spain</option>
                                        <option value="Netherlands">Netherlands</option>
                                        <option value="China">China</option>
                                        <option value="Japan">Japan</option>
                                        <option value="South Korea">South Korea</option>
                                        <option value="Brazil">Brazil</option>
                                        <option value="Argentina">Argentina</option>
                                        <option value="Mexico">Mexico</option>
                                        <option value="Russia">Russia</option>
                                        <option value="Poland">Poland</option>
                                        <option value="Sweden">Sweden</option>
                                        <option value="Norway">Norway</option>
                                        <option value="Denmark">Denmark</option>
                                        <option value="Finland">Finland</option>
                                        <option value="Ireland">Ireland</option>
                                        <option value="Singapore">Singapore</option>
                                        <option value="Hong Kong">Hong Kong</option>
                                        <option value="Taiwan">Taiwan</option>
                                        <option value="Vietnam">Vietnam</option>
                                        <option value="Philippines">Philippines</option>
                                        <option value="Malaysia">Malaysia</option>
                                        <option value="Thailand">Thailand</option>
                                        <option value="Indonesia">Indonesia</option>
                                        <option value="Cambodia">Cambodia</option>
                                        <option value="Laos">Laos</option>
                                        <option value="Myanmar">Myanmar</option>
                                        <option value="Nepal">Nepal</option>
                                        <option value="Sri Lanka">Sri Lanka</option>
                                        <option value="Bangladesh">Bangladesh</option>
                                        <option value="Afghanistan">Afghanistan</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium" htmlFor="fullName">Full Name (First Name & Last Name) *</label>
                                    <input 
                                        type="text" 
                                        id="fullName" 
                                        className="w-full px-2 py-3 bg-white border-2 rounded-lg"
                                        value={newAddress.fullName}
                                        onChange={(e) => onNewAddressChange({...newAddress, fullName: e.target.value})}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium" htmlFor="mobileNumber">Mobile Number *</label>
                                    <input 
                                        type="text" 
                                        id="mobileNumber" 
                                        className="w-full px-2 py-3 bg-white border-2 rounded-lg"
                                        value={newAddress.mobileNumber}
                                        onChange={(e) => onNewAddressChange({...newAddress, mobileNumber: e.target.value})}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium" htmlFor="pinCode">Pincode/ Zip code *</label>
                                    <input 
                                        placeholder="6 digits [0-9] PIN Code" 
                                        type="text" 
                                        id="pinCode" 
                                        className="w-full px-2 py-3 bg-white border-2 rounded-lg"
                                        value={newAddress.pincode}
                                        onChange={(e) => onNewAddressChange({...newAddress, pincode: e.target.value})}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium" htmlFor="StreetName">Street Name *</label>
                                    <input 
                                        type="text" 
                                        id="StreetName" 
                                        className="w-full px-2 py-3 bg-white border-2 rounded-lg"
                                        value={newAddress.streetName}
                                        onChange={(e) => onNewAddressChange({...newAddress, streetName: e.target.value})}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="mb-1 font-medium" htmlFor="LandMark">LandMark</label>
                                    <input 
                                        type="text" 
                                        id="LandMark" 
                                        className="w-full px-2 py-3 bg-white border-2 rounded-lg"
                                        value={newAddress.landmark}
                                        onChange={(e) => onNewAddressChange({...newAddress, landmark: e.target.value})}
                                    />
                                </div>

                                <div className="flex w-full gap-x-4">
                                    <div className="flex flex-col w-full">
                                        <label className="mb-1 font-medium" htmlFor="City">City *</label>
                                        <input 
                                            type="text" 
                                            id="City" 
                                            className="w-full px-2 py-3 bg-white border-2 rounded-lg"
                                            value={newAddress.city}
                                            onChange={(e) => onNewAddressChange({...newAddress, city: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex flex-col w-full">
                                        <label className="mb-1 font-medium" htmlFor="state"> State *</label>
                                        <input 
                                            type="text" 
                                            id="state" 
                                            className="w-full px-2 py-3 bg-white border-2 rounded-lg"
                                            value={newAddress.state}
                                            onChange={(e) => onNewAddressChange({...newAddress, state: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col w-full">
                                    <label className="mb-1 font-medium" htmlFor="additionalAddressDetails"> Additional Address Details</label>
                                    <input 
                                        type="text" 
                                        id="additionalAddressDetails" 
                                        className="w-full px-2 py-3 bg-white border-2 rounded-lg"
                                        value={newAddress.additionalDetails}
                                        onChange={(e) => onNewAddressChange({...newAddress, additionalDetails: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleSaveAddress}
                                disabled={loading}
                                className={`px-3 py-2 rounded-lg mt-4 ml-auto ${
                                    loading 
                                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                                        : 'bg-black text-white hover:bg-gray-800'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </div>
                                ) : (
                                    'Save Address'
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}