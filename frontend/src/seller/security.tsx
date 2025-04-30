import React from "react";
import "../seller/css/components.css";
import "../seller/css/security.css";

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
    email = "jainulivukush@gmail.com",
    isEmailVerified = false,
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setSuccess("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }, 1200);
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
                        marginBottom: "12px",
                        fontSize: "15px",
                    }}
                    required
                />
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
                    border: "1px solid #eee",
                    background: isSubmitting ? "#f3f4f6" : "#fafbfc",
                    color: "#bdbdbd",
                    fontWeight: 500,
                    fontSize: "16px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
            >
                {isSubmitting ? "Changing..." : "Change Password"}
            </button>
            {error && (
                <div style={{ color: "#ef4444", marginTop: "12px", fontSize: "14px" }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{ color: "#22c55e", marginTop: "12px", fontSize: "14px" }}>
                    {success}
                </div>
            )}
        </form>
    );
};

const SecuritySection = () => {
    return(
        <div id="security-section" className="flex flex-col w-[60%] my-auto mx-auto shadow-lg p-6 border-gray-100 rounded-lg">
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
        </div>
     
    );
};


const Security = () => {
    return(
      
        <SecuritySection/>
    );
};

export default Security; 
           