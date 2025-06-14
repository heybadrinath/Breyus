import React from "react";
import OnboardingProgress from "../components/OnboardingProgress";
import { motion } from "framer-motion";
import BreyusLogo from "../seller/vectors/full-logo.svg";
import PasswordAndOTPVerification from "../components/PasswordAndOTPVerification";

const OnBoarding: React.FC = () => {
    const [currentStep, setCurrentStep] = React.useState(1);
    const [isStep2Valid, setIsStep2Valid] = React.useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-8"
                    >
                        <motion.div variants={itemVariants}>
                            <label htmlFor="companyName" className="block text-2xl font-bold text-black">Company Name <span className="text-red-500">*</span></label>
                            <p className="mt-1 text-xs text-gray-500">Please put your full company name as it appears on official documents.</p>
                            <input
                                type="text"
                                name="companyName"
                                id="companyName"
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Enter your company name"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <label htmlFor="companyLocation" className="block text-2xl font-bold text-black">Company Location <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="companyLocation"
                                id="companyLocation"
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Enter your company location"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <label htmlFor="companyEmail" className="block text-2xl font-bold text-black">Company Email Address<span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                name="companyEmail"
                                id="companyEmail"
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Enter your company email address"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <label htmlFor="whatsappNumber" className="block text-2xl font-bold text-black">What your Whatsapp Number ? <span className="text-red-500">*</span></label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    type="text"
                                    name="whatsappNumber"
                                    id="whatsappNumber"
                                    className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                    placeholder="+91 8xxxxxxxxxx"
                                />
                            </div>
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <label htmlFor="gstNumber" className="block text-2xl font-bold text-black">Company GST number <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="gstNumber"
                                id="gstNumber"
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Enter your company GST number"
                            />
                        </motion.div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-8"
                    >
                        <PasswordAndOTPVerification onValidationChange={setIsStep2Valid} />
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-8"
                    >
                        <motion.div variants={itemVariants}>
                            <label className="block text-2xl font-bold text-black ">What best describes breyus's main line of business? <span className="text-red-500">*</span></label>
                            <div className="mt-2 space-y-2">
                                {['Import/Export Company', 'Producer/Manufacturer', 'Commodity Trader', 'International Freight Forwarder', 'Domestic Trucking Company', 'I\'m none of the above', 'Broker/Intermediary/Agent', 'Other'].map((option) => (
                                    <motion.div
                                        key={option}
                                        className="flex items-center"
                                        variants={itemVariants}
                                    >
                                        <input
                                            id={option.replace(/\s/g, '')}
                                            name="lineOfBusiness"
                                            type="checkbox"
                                            className="focus:ring-black h-4 w-4 text-black border-gray-300 rounded"
                                        />
                                        <label htmlFor={option.replace(/\s/g, '')} className="ml-3 block text-sm font-medium text-gray-700">
                                            {option}
                                        </label>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <label className="block text-2xl font-bold text-black">What's breyus average monthly revenue? <span className="text-red-500">*</span></label>
                            <div className="mt-2 space-y-2">
                                {['Less than 1K Dollars', '1K Dollars - 10K Dollars', '10K Dollars - 100K Dollars', '100K Dollars - 1000K dollars'].map((option) => (
                                    <motion.div
                                        key={option}
                                        className="flex items-center"
                                        variants={itemVariants}
                                    >
                                        <input
                                            id={option.replace(/\s/g, '')}
                                            name="financialRange"
                                            type="radio"
                                            className="focus:ring-black h-4 w-4 text-black border-gray-300"
                                        />
                                        <label htmlFor={option.replace(/\s/g, '')} className="ml-3 block text-sm font-medium text-gray-700">
                                            {option}
                                        </label>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-8"
                    >
                        <motion.div variants={itemVariants}>
                            <label htmlFor="companyWebsite" className="block text-2xl font-bold text-black">What is Company website URL?</label>
                            <p className="mt-1 text-xs text-gray-500">Remember to put https:// in front of it. Make sure the website is yours & valid, otherwise we won't be able to give you free trial access.</p>
                            <input
                                type="text"
                                name="companyWebsite"
                                id="companyWebsite"
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Enter your company website"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <label htmlFor="name" className="block text-2xl font-bold text-black">Name <span className="text-red-500">*</span></label>
                            <p className="mt-1 text-xs text-gray-500">Put your first and second name. Please make sure you put all correct information.</p>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Enter your Name"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <label htmlFor="exportedBefore" className="block text-2xl font-bold text-black">Has Your Company exported before? <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="exportedBefore"
                                id="exportedBefore"
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Yes/No"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <label htmlFor="howYouKnowUs" className="block text-2xl font-bold text-black">How do you get to know about Breyus? <span className="text-red-500">*</span></label>
                            <select
                                id="howYouKnowUs"
                                name="howYouKnowUs"
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                            >
                                <option>Select an option</option>
                                <option>Partner company</option>
                                <option>Ad campaign</option>
                                <option>Other</option>
                            </select>
                        </motion.div>
                    </motion.div>
                );
                case 5:
                    return (
                        <motion.div variants={itemVariants}>
                        <label className="block text-2xl font-bold text-black">What's your business roll in the market?<span className="text-red-500">*</span></label>
                        <div className="mt-4 space-y-4">
                            {['Seller', 'Buyer', 'Seller and Buyer'].map((option) => (
                                <motion.div
                                    key={option}
                                    className="flex items-center"
                                    variants={itemVariants}
                                >
                                    <input
                                        id={option.replace(/\s/g, '')}
                                        name="financialRange"
                                        type="radio"
                                        className="focus:ring-black h-4 w-4 text-black border-gray-300"
                                    />
                                    <label htmlFor={option.replace(/\s/g, '')} className="ml-3 block text-sm text-black font-semibold">
                                        {option}
                                    </label>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    );
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left side - Progress Bar */}
            <div className="w-[430px] min-w-[400px] bg-gray-100 px-auto py-8 flex flex-col items-center">
                <div className="my-10">
                    <img src={BreyusLogo} className="h-14" alt="Breyus Logo" />
                </div>
                <OnboardingProgress currentStep={currentStep} />
            </div>

            {/* Right side - Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="border border-gray-300 bg-white p-8 rounded-lg w-full max-w-[900px]">
                    <div className="w-full max-w-[800px] mx-auto">
                        {renderStepContent()}
                    </div>
                    <div className="flex justify-between mt-8 max-w-[800px] mx-auto">
                        {currentStep > 1 && (
                            <button
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors h-fit mt-12"
                            >
                                Previous
                            </button>
                        )}
                        {currentStep < 5 ? (
                            <button
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors ml-auto mt-12"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={() => { }}
                                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors mt-12"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export { OnBoarding };
