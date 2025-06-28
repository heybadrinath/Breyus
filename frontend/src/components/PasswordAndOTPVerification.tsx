import React, { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PasswordAndOTPVerificationProps {
    onValidationChange: (isValid: boolean) => void;
}

const PasswordAndOTPVerification: React.FC<PasswordAndOTPVerificationProps> = ({ onValidationChange }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [mobileOtp, setMobileOtp] = useState<string[]>(new Array(6).fill(''));
    const [mobileOtpStatus, setMobileOtpStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [mobileOtpMessage, setMobileOtpMessage] = useState('');
    const mobileOtpRefs = useRef<Array<HTMLInputElement | null>>([]);

    const [emailOtp, setEmailOtp] = useState<string[]>(new Array(6).fill(''));
    const [emailOtpStatus, setEmailOtpStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [emailOtpMessage, setEmailOtpMessage] = useState('');
    const emailOtpRefs = useRef<Array<HTMLInputElement | null>>([]);

    React.useEffect(() => {
        const isPasswordValid = password.length >= 6 && password === confirmPassword;
        const isMobileOtpValid = mobileOtpStatus === 'success';
        const isEmailOtpValid = emailOtpStatus === 'success';
        onValidationChange(isPasswordValid && isMobileOtpValid && isEmailOtpValid);
    }, [password, confirmPassword, mobileOtpStatus, emailOtpStatus, onValidationChange]);

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        validatePasswords(e.target.value, confirmPassword);
    };

    const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
        validatePasswords(password, e.target.value);
    };

    const validatePasswords = (pwd1: string, pwd2: string) => {
        if (pwd1.length < 6) {
            setPasswordError('Password must be at least 6 characters long.');
        } else if (pwd1 !== pwd2) {
            setPasswordError('Passwords do not match.');
        } else {
            setPasswordError('');
        }
    };

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
        const paste = e.clipboardData.getData('text');
        if (!/^\d{6}$/.test(paste)) return; // Only allow 6 digit numbers

        const newOtp = paste.split('');
        setOtpArray(newOtp);
        newOtp.forEach((char, i) => {
            if (otpRefs.current[i]) {
                otpRefs.current[i]!.value = char; // Set value directly for pasted content
            }
        });
        otpRefs.current[5]?.focus(); // Focus on last input
    };

    const verifyOtp = (
        otp: string[],
        setOtpStatus: React.Dispatch<React.SetStateAction<'idle' | 'success' | 'error'>>,
        setOtpMessage: React.Dispatch<React.SetStateAction<string>>,
        type: 'mobile' | 'email'
    ) => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
            setOtpStatus('error');
            setOtpMessage('Please enter a valid 6-digit OTP.');
            return;
        }

        // Simulate API call
        setTimeout(() => {
            if (otpCode === '111111') { // Example success code
                setOtpStatus('success');
                setOtpMessage(`Your ${type} has been verified successfully.`);
            } else {
                setOtpStatus('error');
                setOtpMessage('Incorrect Authorization Code. Please Try again.');
            }
        }, 1000);
    };

    const resendOtp = (setOtpMessage: React.Dispatch<React.SetStateAction<string>>) => {
        setOtpMessage('Resending code...');
        // Simulate API call
        setTimeout(() => {
            setOtpMessage('Code resent!');
        }, 1000);
    };

    const variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1
                    }
                }
            }}
            className="space-y-8"
        >
            {/* <motion.div variants={variants}>
                <label htmlFor="password" className="block text-2xl font-bold text-black">Set Your Password<span className="text-red-500">*</span></label>
                <input
                    type="password"
                    name="password"
                    id="password"
                    className={`mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none ${passwordError ? '!border-red-500' : ''}`}
                    placeholder="Password"
                    value={password}
                    onChange={handlePasswordChange}
                />
                {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
            </motion.div> */}

            {/* <motion.div variants={variants}>
                <label htmlFor="confirmPassword" className="block text-2xl font-bold text-black">Confirm Password<span className="text-red-500">*</span></label>
                <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    className={`mt-3 block w-full p-2 sm:text-sm !border-b !border-gray-200 !outline-none !shadow-none !focus:shadow-none !focus:outline-none ${passwordError ? '!border-red-500' : ''}`}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                />
            </motion.div> */}

            {/* <motion.div variants={variants}>
                <label htmlFor="mobileOtp" className="block text-2xl font-bold text-black">
                    Verify Your Mobile Number
                    {mobileOtpStatus === 'success' ? (
                        <span className="text-green-500 ml-2">✔️</span>
                    ) : (
                        <span className="text-red-500">*</span>
                    )}
                </label>
                <p className="mt-1 text-xs text-gray-500">Check your SMS for a verification code to continue setting up your Breyus account. Didn't get it? <a href="#" onClick={() => resendOtp(setMobileOtpMessage)} className="text-blue-600 hover:underline">Resend Code</a></p>
                <div className="mt-2 flex space-x-2">
                    {mobileOtp.map((digit, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(e, index, mobileOtp, setMobileOtp, mobileOtpRefs)}
                            onFocus={(e) => e.target.select()}
                            onBlur={() => verifyOtp(mobileOtp, setMobileOtpStatus, setMobileOtpMessage, 'mobile')}
                            onPaste={(e) => handlePaste(e, mobileOtp, setMobileOtp, mobileOtpRefs)}
                            ref={el => { mobileOtpRefs.current[index] = el; }}
                            className={`w-12 h-12 text-center text-xl border rounded-md focus:outline-none focus:ring-2 ${
                                mobileOtpStatus === 'success' ? 'border-green-500 focus:ring-green-500' :
                                mobileOtpStatus === 'error' ? 'border-red-500 focus:ring-red-500' :
                                'border-gray-300 focus:ring-black'
                            }`}
                        />
                    ))}
                </div>
                <AnimatePresence>
                    {mobileOtpMessage && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`mt-2 text-sm ${
                                mobileOtpStatus === 'success' ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                            {mobileOtpMessage}
                        </motion.p>
                    )}
                </AnimatePresence>
            </motion.div> */}

            <motion.div variants={variants}>
                <label htmlFor="emailOtp" className="block text-2xl font-bold text-black">
                    Verify Your Email Address
                    {emailOtpStatus === 'success' ? (
                        <span className="text-green-500 ml-2">✔️</span>
                    ) : (
                        <span className="text-red-500">*</span>
                    )}
                </label>
                <p className="mt-1 text-xs text-gray-500">Check your inbox for a verification code to continue setting up your Breyus account. Didn't get it? <a href="#" onClick={() => resendOtp(setEmailOtpMessage)} className="text-blue-600 hover:underline">Resend Code</a></p>
                <div className="mt-2 flex space-x-2">
                    {emailOtp.map((digit, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(e, index, emailOtp, setEmailOtp, emailOtpRefs)}
                            onFocus={(e) => e.target.select()}
                            onBlur={() => verifyOtp(emailOtp, setEmailOtpStatus, setEmailOtpMessage, 'email')}
                            onPaste={(e) => handlePaste(e, emailOtp, setEmailOtp, emailOtpRefs)}
                            ref={el => { emailOtpRefs.current[index] = el; }}
                            className={`w-12 h-12 text-center text-xl border rounded-md focus:outline-none focus:ring-2 ${
                                emailOtpStatus === 'success' ? 'border-green-500 focus:ring-green-500' :
                                emailOtpStatus === 'error' ? 'border-red-500 focus:ring-red-500' :
                                'border-gray-300 focus:ring-black'
                            }`}
                        />
                    ))}
                </div>
                <AnimatePresence>
                    {emailOtpMessage && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`mt-2 text-sm ${
                                emailOtpStatus === 'success' ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                            {emailOtpMessage}
                        </motion.p>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default PasswordAndOTPVerification; 