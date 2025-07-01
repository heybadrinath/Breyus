import React, { useState, ChangeEvent, useRef } from "react";
import OnboardingProgress from "../components/OnboardingProgress";
import { motion, AnimatePresence } from "framer-motion";
import BreyusLogo from "../seller/vectors/full-logo.svg";

// import service (backend integration)
import { sendOtpService, verifyOtpService, validateTokenService, setPasswordService, continueOnboardingService } from '../services/onboarding';



const OnBoarding: React.FC = () => {
    const [onboarding, setonboarding] = React.useState<{ token?: string, onboardingStatus?: boolean }>({});
    const [ismailverified, setIsMailverified] = React.useState(false);
    const [currentStep, setCurrentStep] = React.useState(1);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [successMessage, setSuccessMessage] = React.useState('');
    const [emailOtpStatus, setEmailOtpStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [accountExists, setAccountExists] = React.useState(false);
    const [createAccount, setCreateAccount] = React.useState(false)
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);

    //animation variants
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


    // step 1 

    // handle mail input
    const [mail, setMail] = useState('');
    const handleChangeMail = (e: ChangeEvent<HTMLInputElement>) => {
        setMail(e.target.value);
    };

    // mail onblur to make otp visible 
    const [ismailentered, setIsMailEntered] = useState(false);
    const handleMailBlur = async () => {
        if (!ismailentered) {
            try {
                await sendOtpService(mail);
                setSuccessMessage("Email successfully sent to your mail");
                setErrorMessage('');
            } catch (error: any) {
                setErrorMessage(error?.message || "Failed to send OTP. Please try again.");
                setSuccessMessage('');
            }
        }
        setIsMailEntered(true);
    }


    // handle otp 
    const [emailOtp, setEmailOtp] = useState<string[]>(new Array(6).fill(''));


    const emailOtpRefs = useRef<Array<HTMLInputElement | null>>([]);
    const handleOtpChange = (
        e: ChangeEvent<HTMLInputElement>,
        index: number,
        otpArray: string[],
        setOtpArray: React.Dispatch<React.SetStateAction<string[]>>,
        otpRefs: React.MutableRefObject<Array<HTMLInputElement | null>>
    ) => {
        const { value } = e.target;
        if (/[^0-9]/.test(value)) return; // Only allow numbers

        const newOtp = [...otpArray];
        newOtp[index] = value;
        setOtpArray(newOtp);

        // Move to next input if current is filled
        if (value && index < otpArray.length - 1) {
            otpRefs.current[index + 1]?.focus();
        }
        // Move to previous input if backspace is pressed and current is empty
        if (!value && index > 0 && (e.nativeEvent as InputEvent).inputType === 'deleteContentBackward') {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (
        e: React.ClipboardEvent<HTMLInputElement>,
        otpArray: string[],
        setOtpArray: React.Dispatch<React.SetStateAction<string[]>>,
        otpRefs: React.MutableRefObject<Array<HTMLInputElement | null>>
    ) => {
        e.preventDefault(); // Prevent default paste behavior
        const paste = e.clipboardData.getData('text');
        if (!/^\d{6}$/.test(paste)) return;

        const newOtp = paste.split('');
        setOtpArray(newOtp);

        // Focus on the last input after state update
        setTimeout(() => {
            otpRefs.current[5]?.focus();
        }, 0);
    };



    const verifyOtp = (
        otp: string[],
        setOtpStatus: React.Dispatch<React.SetStateAction<'idle' | 'success' | 'error'>>,
        type: 'email'
    ) => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
            setOtpStatus('error');
            setErrorMessage('Please enter a valid 6-digit OTP.');
            return;
        }

        // verify otp function call service
        (async () => {
            if (!ismailverified) {
                try {

                    setonboarding(await verifyOtpService(mail, otpCode));
                    setOtpStatus('success');
                    setSuccessMessage('OTP verified successfully!');
                    setErrorMessage('');
                    // todo disable duplicate submissions and disable email and otp input
                    setIsMailverified(true);
                } catch (error: any) {
                    setOtpStatus('error');
                    setErrorMessage(error?.message || 'Failed to verify OTP. Please try again.');
                    setSuccessMessage('');
                }

            }

        })();
    };




    // Resend OTP handler for email
    const handleResendEmailOtp = async () => {
        if (!mail || ismailverified) return;
        try {
            setSuccessMessage('');
            setErrorMessage('');
            await sendOtpService(mail);
            setSuccessMessage('Verification code resent to your email.');
            setEmailOtpStatus('idle');
            setEmailOtp(new Array(6).fill(''));
            emailOtpRefs.current[0]?.focus();
        } catch (error: any) {
            setErrorMessage(error?.message || 'Failed to resend OTP. Please try again.');
        }
    };


    //validate token sent during otp validation and check if user already onboarded
    if (ismailverified) {

        (async () => {
            try {
                const response = await validateTokenService(onboarding.token as string);
                const responseObject = await response.json();
                const UserExists = responseObject.status;
                setSuccessMessage('');
                if (UserExists === 'accountExists') {
                    setAccountExists(true);
                } else{
                    setCreateAccount(true);
                }
                

            } catch (e) {
                setErrorMessage("Unauthorised Access");
                setSuccessMessage('');
                console.log(onboarding.token);
            }
        })();
    }

    



    // handle password
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        validatePasswords(e.target.value, confirmPassword);
    };

    const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
        validatePasswords(password, e.target.value);
    };

    const validatePasswords = (pwd1: string, pwd2: string) => {
        if (pwd1.length < 8) {
            setPasswordError('Password must be at least 8 characters long.');
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/.test(pwd1)) {
            setPasswordError('Password must contain uppercase, lowercase, number, and special character.');
        } else if (pwd1 !== pwd2) {
            setPasswordError('Passwords do not match.');
        } else {
            setPasswordError('');
        }
    };

    //handle password to create account
    const [isPasswordSubmitted, setIsPasswordSubmitted] = useState(false);

    const ServiceCreateAccount = async () => {
        if (isPasswordSubmitted) return;
        try {
            await setPasswordService(onboarding.token as string, password, confirmPassword);
            setSuccessMessage("Account created successfully!");
            setErrorMessage('');
            setIsPasswordSubmitted(true);
        } catch (e) {
            setErrorMessage("Error, failed onboarding please try again");
            setSuccessMessage('');
        } 
    }

    // handle current password if user exists with partial onboarding
    const [currentPassword, setCurrentPassword] = useState('');

    const handleCurrentPasswordChange = async (e: ChangeEvent<HTMLInputElement>) => {
        setCurrentPassword(e.target.value);
    }

    const ServiceCurrentPasswordChange = async () => {
        if (isPasswordVerified) return true;
        try {
            await continueOnboardingService(onboarding.token as string, currentPassword);
            setSuccessMessage("Verified successfully!");
            setErrorMessage('');
            setIsPasswordVerified(true);
            return true;
        } catch (e) {
            setErrorMessage("Error, failed to verify password please try again");
            return false;
        }
    }

   






    // step 2 logic
    const [step2Form, setStep2Form] = useState(
        {
            companyName: '',
            companyLocation: '',
            contactNumber: '',
            taxId: '',
        }
    );
    const handleStep2InputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setStep2Form((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };



    // step 3 logic
    const [mainlineOfBusiness, setmainLineOfBusiness] = useState<string[]>([]);
    const handleMainLineOfBusinessChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (e.target.checked) {

            setmainLineOfBusiness((prevState) => [...prevState, value]);
        } else {

            setmainLineOfBusiness((prevState) => prevState.filter((item) => item !== value));
        }
    };

    const [financialRange, setFinancialRange] = useState<string>('');
    const handleFinancialRangeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFinancialRange(e.target.value);
    };


    // step 4 logic
    const [step4Form, setStep4Form] = useState(
        {
            companyWebsiteUrl: '',
            founderName: '',
            exporedBefore: '',
            referrel: ''
        }
    );
    const handleStep4InputChange = (
        e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setStep4Form((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    // step 5 logic
    const [role, setRole] = useState('');
    const handleRoleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRole(e.target.value);
    }



    // render step ui content dynamically
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div
                        key={currentStep}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-8"
                    >



                        <motion.div>
                            <label htmlFor="companyEmail" className="block text-2xl font-bold text-black">
                                Company Email Address<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="mail"
                                id="companyEmail"
                                value={mail}
                                required
                                onChange={handleChangeMail}
                                disabled={ismailverified}
                                onBlur={(e) => {
                                    const value = e.target.value.trim();
                                    // Simple email validation regex
                                    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                                    if (value !== '' && isValidEmail) {
                                        handleMailBlur();
                                    }
                                }}
                                className={`mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none ${(ismailverified) ? 'cursor-not-allowed' : 'cursor-auto'}`}
                                placeholder="Enter your company email address"
                            />
                        </motion.div>


                        <AnimatePresence>
                            {ismailentered && (
                                <motion.div
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    className=""
                                >

                                    <p className="mt-1 text-xs text-gray-500">
                                        Check your inbox for a verification code to continue setting up your Breyus account. Didn't get it?{" "}
                                        <a href="#" onClick={() => handleResendEmailOtp} className={`text-blue-600 hover:underline ${(ismailverified) ? 'cursor-not-allowed' : 'cursor-auto'}`}>
                                            Resend Code
                                        </a>
                                    </p>
                                    <div className="mt-2 flex space-x-2">
                                        {emailOtp.map((digit, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                maxLength={1}
                                                value={digit}
                                                disabled={ismailverified}
                                                onChange={(e) => handleOtpChange(e, index, emailOtp, setEmailOtp, emailOtpRefs)}
                                                onFocus={(e) => e.target.select()}
                                                onBlur={() => verifyOtp(emailOtp, setEmailOtpStatus, 'email')}
                                                onPaste={(e) => handlePaste(e, emailOtp, setEmailOtp, emailOtpRefs)}
                                                ref={el => { emailOtpRefs.current[index] = el; }}
                                                className={`w-12 h-12 text-center text-xl border rounded-md focus:outline-none focus:ring-1 ${emailOtpStatus === 'success'
                                                    ? 'border-green-500 focus:ring-green-500'
                                                    : emailOtpStatus === 'error'
                                                        ? 'border-red-500 focus:ring-red-500'
                                                        : 'border-gray-300 focus:ring-black'
                                                    }  ${(ismailverified) ? 'cursor-not-allowed' : 'cursor-auto'}`}
                                            />
                                        ))}
                                    </div>
                                    <div></div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {accountExists && (
                            <motion.div variants={itemVariants}>
                                <label htmlFor="currentPassword" className="block text-2xl font-bold text-black">Enter Your password<span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    id="currentPassword"
                                    className={`mt-3 block w-full p-2 sm:text-sm  !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none ${passwordError ? '!border-red-500' : ''} ${isPasswordVerified ? 'cursor-not-allowed' : 'cursor-auto'}`}
                                    placeholder="Enter Your Password"
                                    value={currentPassword}
                                    onChange={handleCurrentPasswordChange}
                                    disabled={isPasswordVerified}
                                />
                                {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
                            </motion.div>
                        )}

                        {createAccount && (
                            <>
                                <motion.div variants={itemVariants}>
                                    <label htmlFor="password" className="block text-2xl font-bold text-black">Set Your Password<span className="text-red-500">*</span></label>
                                    <input
                                        type="password"
                                        name="password"
                                        id="password"
                                        className={`mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none ${passwordError ? '!border-red-500' : ''} ${isPasswordSubmitted ? 'cursor-not-allowed' : 'cursor-auto'}`}
                                        placeholder="Password"
                                        value={password}
                                        disabled={isPasswordSubmitted}
                                        onChange={handlePasswordChange}
                                    />
                                    {/* {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>} */}
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <label htmlFor="confirmPassword" className="block text-2xl font-bold text-black">Confirm Password<span className="text-red-500">*</span></label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        id="confirmPassword"
                                        className={`mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none ${passwordError ? '!border-red-500' : ''} ${isPasswordSubmitted ? 'cursor-not-allowed' : 'cursor-auto'}`}
                                        placeholder="Confirm Password"
                                        disabled={isPasswordSubmitted}
                                        value={confirmPassword}
                                        onChange={handleConfirmPasswordChange}
                                    />
                                </motion.div>
                            </>
                        )}


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

                        <motion.div variants={itemVariants}>
                            <label htmlFor="companyName" className="block text-2xl font-bold text-black">Company Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="companyName"
                                id="companyName"
                                value={step2Form.companyName}
                                required
                                onChange={handleStep2InputChange}
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Enter your company location"
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label htmlFor="companyLocation" className="block text-2xl font-bold text-black">Company Location <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="companyLocation"
                                id="companyLocation"
                                value={step2Form.companyLocation}
                                required
                                onChange={handleStep2InputChange}
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Enter your company location"
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label htmlFor="whatsappNumber" className="block text-2xl font-bold text-black">What your Whatsapp Number ? <span className="text-red-500">*</span></label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    type="text"
                                    name="contactNumber"
                                    id="whatsappNumber"
                                    value={step2Form.contactNumber}
                                    required
                                    onChange={handleStep2InputChange}
                                    className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                    placeholder="+91 8xxxxxxxxxx"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label htmlFor="taxId" className="block text-2xl font-bold text-black">Tax Id <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="taxId"
                                id="taxId"
                                value={step2Form.taxId}
                                required
                                onChange={handleStep2InputChange}
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Enter your company GST number"
                            />
                        </motion.div>

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
                                {[
                                    'Import/Export Company',
                                    'Producer/Manufacturer',
                                    'Commodity Trader',
                                    'International Freight Forwarder',
                                    'Domestic Trucking Company',
                                    "I'm none of the above",
                                    'Broker/Intermediary/Agent',
                                    'Other',
                                ].map((option) => (
                                    <div key={option} className="flex items-center">
                                        <input
                                            id={option.replace(/\s/g, '')}
                                            name="mainlineOfBusiness"
                                            type="checkbox"
                                            value={option}
                                            checked={mainlineOfBusiness.includes(option)} // Check if this option is selected
                                            onChange={handleMainLineOfBusinessChange} // Handle change
                                            className="focus:ring-black h-4 w-4 text-black border-gray-300 rounded"
                                        />
                                        <label htmlFor={option.replace(/\s/g, '')} className="ml-3 block text-sm font-medium text-gray-700">
                                            {option}
                                        </label>
                                    </div>
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
                                            value={option}
                                            checked={financialRange === option}
                                            onChange={handleFinancialRangeChange}
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
                                name="companyWebsiteUrl"
                                id="companyWebsite"
                                value={step4Form.companyWebsiteUrl}
                                onChange={handleStep4InputChange}
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Enter your company website"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <label htmlFor="name" className="block text-2xl font-bold text-black">Founder Name <span className="text-red-500">*</span></label>
                            <p className="mt-1 text-xs text-gray-500">Put your first and second name. Please make sure you put all correct information.</p>
                            <input
                                type="text"
                                name="founderName"
                                id="name"
                                value={step4Form.founderName}
                                onChange={handleStep4InputChange}
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                                placeholder="Enter Founder Name"
                            />
                        </motion.div>


                        <motion.div variants={itemVariants}>
                            <label htmlFor="exporedBefore" className="block text-2xl font-bold text-black">
                                Has your company exported before?
                            </label>
                            <select
                                name="exporedBefore"
                                id="exporedBefore"
                                value={step4Form.exporedBefore}
                                onChange={handleStep4InputChange}
                                className="mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none"
                            >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </motion.div>


                        <motion.div variants={itemVariants}>
                            <label htmlFor="referrel" className="block text-2xl font-bold text-black">How do you get to know about Breyus? <span className="text-red-500">*</span></label>
                            <select
                                id="referrel"
                                name="referrel"
                                value={step4Form.referrel}
                                onChange={handleStep4InputChange}
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
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-8"
                    >
                        <motion.div variants={itemVariants}>
                            <label className="block text-2xl font-bold text-black">What's your business roll in the market?<span className="text-red-500">*</span></label>
                            <div className="mt-4 space-y-4">
                                {['Seller', 'Buyer', 'Seller and Buyer'].map((option, index) => (
                                    <motion.div
                                        key={option}
                                        className="flex items-center"
                                        variants={itemVariants}
                                    >
                                        <input
                                            id={option.replace(/\s/g, '')}
                                            name="role"
                                            type="radio"
                                            value={option}
                                            checked={role === option}
                                            onChange={handleRoleInputChange}
                                            className="focus:ring-black h-4 w-4 text-black border-gray-300"
                                        />
                                        <label htmlFor={option.replace(/\s/g, '')} className="ml-3 block text-sm text-black font-semibold">
                                            {option}
                                        </label>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    // Validation for each step
    const validateStep = (step: number): boolean => {
        setErrorMessage("");
        if (step === 1) {
            if (!mail) {
                setErrorMessage("Email is required.");
                return false;
            }
            const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
            if (!isValidEmail) {
                setErrorMessage("Please enter a valid email address.");
                return false;
            }
            if (!ismailentered) {
                setErrorMessage("Please enter your email and request OTP.");
                return false;
            }
            if (!ismailverified) {
                if (emailOtp.join("").length !== 6 || !/^\d{6}$/.test(emailOtp.join(""))) {
                    setErrorMessage("Please enter a valid 6-digit OTP.");
                    return false;
                }
            }
            if (accountExists && !currentPassword) {
                setErrorMessage("Password is required.");
                return false;
            }
            if (createAccount) {
                if (!password || !confirmPassword) {
                    setErrorMessage("Password and confirm password are required.");
                    return false;
                }
                if (password.length < 8) {
                    setErrorMessage("Password must be at least 8 characters long.");
                    return false;
                }
                // Password must have uppercase, lowercase, number, special char
                const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/;
                if (!strongPassword.test(password)) {
                    setErrorMessage("Password must contain uppercase, lowercase, number, and special character.");
                    return false;
                }
                if (password !== confirmPassword) {
                    setErrorMessage("Passwords do not match.");
                    return false;
                }
            }
        }
        // Step 2: Company Info
        if (step === 2) {
            if (!step2Form.companyName || step2Form.companyName.length < 2) {
                setErrorMessage("Company name is required (min 2 characters).");
                return false;
            }
            if (!step2Form.companyLocation || step2Form.companyLocation.length < 2) {
                setErrorMessage("Company location is required (min 2 characters).");
                return false;
            }
            if (!step2Form.contactNumber || !/^\+?\d{10,15}$/.test(step2Form.contactNumber)) {
                setErrorMessage("Please enter a valid Whatsapp number (10-15 digits, with or without country code).");
                return false;
            }
            if (!step2Form.taxId || step2Form.taxId.length < 8) {
                setErrorMessage("Tax ID is required (min 8 characters).");
                return false;
            }
        }
        // Step 3: Business Info
        if (step === 3) {
            if (mainlineOfBusiness.length === 0) {
                setErrorMessage("Please select at least one business type.");
                return false;
            }
            if (!financialRange) {
                setErrorMessage("Please select your monthly revenue range.");
                return false;
            }
        }
        // Step 4: More Info
        if (step === 4) {
            if (!step4Form.companyWebsiteUrl || !/^https?:\/\/.+\..+/.test(step4Form.companyWebsiteUrl)) {
                setErrorMessage("Please enter a valid company website URL (must start with http/https).");
                return false;
            }
            if (!step4Form.founderName || step4Form.founderName.length < 2) {
                setErrorMessage("Founder name is required (min 2 characters).");
                return false;
            }
            if (!step4Form.exporedBefore) {
                setErrorMessage("Please select if your company has exported before.");
                return false;
            }
            if (!step4Form.referrel || step4Form.referrel === "Select an option" || step4Form.referrel === "") {
                setErrorMessage("Please select how you got to know about Breyus.");
                return false;
            }
        }
        // Step 5: Role
        if (step === 5) {
            if (!role) {
                setErrorMessage("Please select your business role in the market.");
                return false;
            }
        }
        return true;
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

                    <>

                        <div className="mt-3 mx-6 text-red-600 text-sm"> {errorMessage}</div>
                        <div className="mt-3 mx-6 text-green-600 text-sm"> {successMessage}</div>

                        <div className="flex justify-between max-w-[800px] mx-auto">

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
                                    onClick={async () => {
                                        // If password is required and not verified, try to verify first
                                        if (currentStep === 1 && accountExists && !isPasswordVerified) {
                                            const verified = await ServiceCurrentPasswordChange();
                                            if (verified) {
                                                setCurrentStep(prev => prev + 1);
                                            }
                                            return;
                                        }
                                        if (!validateStep(currentStep)) return;
                                        setCurrentStep(prev => prev + 1);
                                        if (currentStep === 1 && createAccount && !isPasswordSubmitted) ServiceCreateAccount();
                                    }}
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
                    </>
                </div>
            </div>
        </div>
    );
};

export { OnBoarding };
