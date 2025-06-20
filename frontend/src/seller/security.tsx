import React from "react";
import "../seller/css/components.css";
import "../seller/css/security.css";
import { Link } from "react-router-dom";
import authService from "../services/auth.service";
import axios from "axios";
import userDetailsService from "../services/user-details.service";

interface SecuritySectionProps {
    email?: string;
    isEmailVerified?: boolean;
    onResendVerification?: () => void;
}

const HorizontalLine: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <hr
        style={{
            border: "none",
            borderTop: "1px solid #e3e8ee",
            margin: "24px 0",
            ...style,
        }}
    />
);

const CreatePasskey: React.FC<SecuritySectionProps & { className?: string }> = ({
    email= "test@gmail.com",
    isEmailVerified= false,
    onResendVerification,
    className = "",
}) => {
    return (
        <div id="security-section" className={` ${className}`}>
            <h4>Create a Passkey takes under a min</h4>
            <button
                className="passkey-btn"
                disabled={!isEmailVerified}
                style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #eee",
                    background: "#fafbfc",
                    color: "#bdbdbd",
                    fontWeight: 500,
                    fontSize: "16px",
                    marginBottom: "16px",
                    cursor: isEmailVerified ? "pointer" : "not-allowed",
                }}
            >
                Create a Passkey
            </button>
            {!isEmailVerified && (
                <div
                    style={{
                        background: "#f7fafd",
                        border: "1px solid #e3e8ee",
                        borderRadius: "8px",
                        padding: "16px",
                        color: "#3b82f6",
                        fontSize: "15px",
                    }}
                >
                    Verify your email address{" "}
                    <span style={{ fontWeight: 500 }}>{email}</span> to create a passkey.{" "}
                    <a
                        href="#"
                        style={{ color: "#3b82f6", textDecoration: "underline" }}
                        onClick={e => {
                            e.preventDefault();
                            onResendVerification && onResendVerification();
                        }}
                    >
                        Resend verification email
                    </a>
                </div>
            )}
        </div>
    );
};

const ChangePassword: React.FC<{ className?: string }> = ({ className = "" }) => {
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = React.useState<"weak" | "medium" | "strong" | null>(null);

    // Calculate password strength
    React.useEffect(() => {
        if (!newPassword) {
            setPasswordStrength(null);
            return;
        }
        
        // Password strength criteria
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
        const isLongEnough = newPassword.length >= 8;
        
        const score = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, isLongEnough].filter(Boolean).length;
        
        if (score <= 2) setPasswordStrength("weak");
        else if (score <= 4) setPasswordStrength("medium");
        else setPasswordStrength("strong");
    }, [newPassword]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validate inputs
        if (!currentPassword) {
            setError("Current password is required.");
            return;
        }

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        if (newPassword === currentPassword) {
            setError("New password must be different from your current password.");
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Get the token for authentication
            const token = authService.getToken();
            if (!token) {
                setError("Authentication required. Please log in again.");
                return;
            }

            // Call the real backend API
            const response = await axios.post('http://localhost:5000/backend/security/change-password', {
                currentPassword,
                newPassword
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.message) {
                // Clear form and show success message
                setSuccess("Password updated successfully");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPasswordStrength(null);
            }
        } catch (err: any) {
            console.error('Password change error:', err);
            
            // Handle different error cases
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.status === 401) {
                setError("Current password is incorrect.");
            } else if (err.response?.status === 403) {
                setError("Access denied. Please log in again.");
                authService.logout();
            } else {
                setError("Failed to update password. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get color for password strength indicator
    const getPasswordStrengthColor = () => {
        if (passwordStrength === "weak") return "#ef4444";  // Red
        if (passwordStrength === "medium") return "#f59e0b"; // Amber
        if (passwordStrength === "strong") return "#22c55e"; // Green
        return "#e5e7eb"; // Gray
    };

    return (
        <form
            className={`change-password-container ${className}`}
            style={{
                border: "1px solid #e3e8ee",
                borderRadius: "12px",
                padding: "32px",
                marginTop: "24px",
                background: "#fff",
                maxWidth: "400px",
            }}
            onSubmit={handleSubmit}
        >
            <div style={{ marginBottom: "20px" }}>
                <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #eee",
                        marginBottom: "12px",
                        fontSize: "15px",
                    }}
                    required
                />
                <div style={{ position: "relative", marginBottom: "12px" }}>
                    <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid #eee",
                            fontSize: "15px",
                        }}
                        required
                    />
                    {passwordStrength && (
                        <div style={{ marginTop: "4px", fontSize: "12px", display: "flex", alignItems: "center" }}>
                            <div style={{ 
                                width: "100px", 
                                height: "4px", 
                                backgroundColor: "#e5e7eb", 
                                borderRadius: "2px",
                                marginRight: "8px"
                            }}>
                                <div style={{ 
                                    width: passwordStrength === "weak" ? "33%" : passwordStrength === "medium" ? "66%" : "100%", 
                                    height: "100%", 
                                    backgroundColor: getPasswordStrengthColor(), 
                                    borderRadius: "2px",
                                    transition: "width 0.3s ease"
                                }} />
                            </div>
                            <span style={{ color: getPasswordStrengthColor() }}>
                                {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)} password
                            </span>
                        </div>
                    )}
                </div>
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #eee",
                        marginBottom: "12px",
                        fontSize: "15px",
                    }}
                    required
                />
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background: isSubmitting ? "#f3f4f6" : "#000000",
                    color: isSubmitting ? "#bdbdbd" : "#ffffff",
                    fontWeight: 500,
                    fontSize: "16px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease"
                }}
            >
                {isSubmitting ? "Updating..." : "Update Password"}
            </button>
            {error && (
                <div style={{ color: "#ef4444", marginTop: "12px", fontSize: "14px" }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{ color: "#22c55e", marginTop: "12px", fontSize: "14px", fontWeight: "500" }}>
                    {success}
                </div>
            )}
        </form>
    );
};

const TwoFactorAuthentication: React.FC<{ className?: string }> = ({ className = "" }) => {
    return (
        <div
            className={className}
            style={{
                border: "1px solid #e3e8ee",
                borderRadius: "12px",
                padding: "32px",
                background: "#fff",
                maxWidth: "600px",
                margin: "24px auto",
            }}
        >
            <div style={{ marginBottom: "24px", fontSize: "16px", color: "#222" }}>
                After entering your password, verify your identity with an authentication method.
            </div>
            <div
                style={{
                    background: "#f7fafd",
                    border: "1px solid #e3e8ee",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "24px",
                    fontSize: "16px",
                }}
            >
                <b>Two-step authentication</b> adds a layer of security to your account by using more than just your password to log in.
            </div>
            <div style={{ fontWeight: 600, marginBottom: "8px" }}>How it works</div>
            <div style={{ fontSize: "15px", marginBottom: "12px" }}>
                When you log in to BREYUS, you'll need to:
            </div>
            <ol style={{ paddingLeft: "20px", fontSize: "15px", marginBottom: "12px" }}>
                <li style={{ marginBottom: "8px" }}>
                    Enter your email and password
                </li>
                <li>
                    Complete a second step to prove that it's you logging in. You can enter a verification code, use a security key, or confirm your login on a trusted device.
                </li>
            </ol>
            <button
                disabled
                style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #eee",
                    background: "#fafbfc",
                    color: "#bdbdbd",
                    fontWeight: 500,
                    fontSize: "16px",
                    marginBottom: "16px",
                    cursor: "not-allowed",
                }}
            >
                Turn on two-step
            </button>
            <div
                style={{
                    background: "#f7fafd",
                    border: "1px solid #e3e8ee",
                    borderRadius: "8px",
                    padding: "12px",
                    color: "#3b82f6",
                    fontSize: "15px",
                }}
            >
                Verify your email address TEST@GMAIL.COM to create a passkey.{" "}
                <a
                    href="#"
                    style={{ color: "#3b82f6", textDecoration: "underline" }}
                    onClick={e => e.preventDefault()}
                >
                    Resend verification email
                </a>
            </div>
        </div>
    );
};

const SecuritySection = () => {
    return(
        <div id="security-section" className="flex flex-col w-[96%] my-12 mx-auto shadow-lg p-6 border-gray-100 rounded-lg">
            <h2 className="font-extrabold text-3xl">Security</h2>
            <HorizontalLine />
            <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="max-w-[340px] bg-white rounded-xl p-6 shadow-sm my-auto mx-4">
                <div className="font-bold text-[22px] mb-2">Passkey</div>
                <div className="text-[#222] text-base leading-relaxed">
                Log in with your fingerprint, face recognition or a PIN instead of a password. Passkeys can be synced across devices logged into the same platform (like Apple ID or a Google account).
                </div>
            </div>
            <CreatePasskey className="!w-[45%] mx-6" />
            </div>
            <HorizontalLine />
            <div className=" bg-white rounded-xl p-6 shadow-sm my-auto mx-4 flex">
                <div className="font-bold text-[22px] mx-6 justify-between my-auto">Password</div>
        
            <ChangePassword className="w-[100%] ml-auto"/>
            </div>
            <HorizontalLine />

            <div className="flex justify-between">
                <div className="mt-4">
                    <h2 className="text-2xl font-extrabold">Two-step authentication</h2>
                    <p className="text-md">Learn more about <a className="underline font-bold" href="https://support.google.com/accounts/answer/185839" target="_blank" rel="noopener noreferrer">two-step authentication</a></p>
                </div>
                <TwoFactorAuthentication className="!w-[55%] !mx-4 !my-2" />
            </div>
        </div>
     
    );
};


const Security = () => {
    return(
      
        <SecuritySection/>
    );
};

export default Security; 
           