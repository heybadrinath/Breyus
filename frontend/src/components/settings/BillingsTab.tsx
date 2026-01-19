import React, { useState, useEffect } from "react";
import { Loader2, CreditCard, Mail, Edit2, Check, X } from "lucide-react";
import { CompanyProfile, updateCompanyProfile } from "../../services/company.service";

interface BillingsTabProps {
    profile: CompanyProfile | null;
    onUpdate: (profile: CompanyProfile) => void;
}

const BillingsTab: React.FC<BillingsTabProps> = ({ profile, onUpdate }) => {
    const [isEditingBank, setIsEditingBank] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [useExistingEmail, setUseExistingEmail] = useState(
        profile?.billingPreferences?.useExistingEmail ?? true
    );
    const [invoiceEmail, setInvoiceEmail] = useState(
        profile?.billingPreferences?.invoiceEmail || ''
    );

    const [bankForm, setBankForm] = useState({
        ifscCode: profile?.bankInfo?.ifscCode || '',
        accountNumber: profile?.bankInfo?.accountNumber || '',
        accountHolderName: profile?.bankInfo?.accountHolderName || '',
        bankAddress: profile?.bankInfo?.bankAddress || '',
        bankBranch: profile?.bankInfo?.bankBranch || '',
    });

    useEffect(() => {
        setUseExistingEmail(profile?.billingPreferences?.useExistingEmail ?? true);
        setInvoiceEmail(profile?.billingPreferences?.invoiceEmail || '');
        setBankForm({
            ifscCode: profile?.bankInfo?.ifscCode || '',
            accountNumber: profile?.bankInfo?.accountNumber || '',
            accountHolderName: profile?.bankInfo?.accountHolderName || '',
            bankAddress: profile?.bankInfo?.bankAddress || '',
            bankBranch: profile?.bankInfo?.bankBranch || '',
        });
    }, [profile]);

    const handleBankInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBankForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveBankInfo = async () => {
        try {
            setIsSaving(true);
            setError(null);

            const updatedProfile = await updateCompanyProfile({
                bankInfo: bankForm,
            });
            onUpdate(updatedProfile);
            setIsEditingBank(false);
            setSuccessMessage('Bank information updated successfully');
        } catch (err: any) {
            console.error('Error saving bank info:', err);
            setError(err.message || 'Failed to update bank information');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveInvoicePreference = async () => {
        try {
            setIsSaving(true);
            setError(null);

            const updatedProfile = await updateCompanyProfile({
                billingPreferences: {
                    useExistingEmail,
                    invoiceEmail: useExistingEmail ? undefined : invoiceEmail,
                },
            } as any);
            onUpdate(updatedProfile);
            setSuccessMessage('Invoice preferences updated successfully');
        } catch (err: any) {
            console.error('Error saving invoice preferences:', err);
            setError(err.message || 'Failed to update invoice preferences');
        } finally {
            setIsSaving(false);
        }
    };

    const cancelBankEdit = () => {
        setBankForm({
            ifscCode: profile?.bankInfo?.ifscCode || '',
            accountNumber: profile?.bankInfo?.accountNumber || '',
            accountHolderName: profile?.bankInfo?.accountHolderName || '',
            bankAddress: profile?.bankInfo?.bankAddress || '',
            bankBranch: profile?.bankInfo?.bankBranch || '',
        });
        setIsEditingBank(false);
    };

    const maskAccountNumber = (accountNumber: string) => {
        if (!accountNumber || accountNumber.length < 4) return accountNumber;
        return '****' + accountNumber.slice(-4);
    };

    return (
        <div className="w-full space-y-6">
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Payment Method / Bank Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-gray-700" />
                        <h3 className="text-xl font-bold text-gray-800">Account Details</h3>
                    </div>
                    {isEditingBank ? (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveBankInfo}
                                disabled={isSaving}
                                className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                                Save
                            </button>
                            <button
                                onClick={cancelBankEdit}
                                disabled={isSaving}
                                className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditingBank(true)}
                            className="flex items-center gap-1 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                            <Edit2 className="h-4 w-4" />
                            Edit
                        </button>
                    )}
                </div>

                {isEditingBank ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">IFSC Code</label>
                            <input
                                type="text"
                                name="ifscCode"
                                value={bankForm.ifscCode}
                                onChange={handleBankInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter IFSC Code"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Account Number</label>
                            <input
                                type="text"
                                name="accountNumber"
                                value={bankForm.accountNumber}
                                onChange={handleBankInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter Account Number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Account Holder Name</label>
                            <input
                                type="text"
                                name="accountHolderName"
                                value={bankForm.accountHolderName}
                                onChange={handleBankInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter Account Holder Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Bank Address</label>
                            <input
                                type="text"
                                name="bankAddress"
                                value={bankForm.bankAddress}
                                onChange={handleBankInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter Bank Address"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-500 mb-1">Bank Main Branch Address</label>
                            <input
                                type="text"
                                name="bankBranch"
                                value={bankForm.bankBranch}
                                onChange={handleBankInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter Bank Main Branch Address"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">IFSC CODE</p>
                                <p className="font-medium text-gray-800">{profile?.bankInfo?.ifscCode || '-----'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">ACCOUNT NUMBER</p>
                                <p className="font-medium text-gray-800">
                                    {profile?.bankInfo?.accountNumber
                                        ? maskAccountNumber(profile.bankInfo.accountNumber)
                                        : '-----'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">ACCOUNT HOLDER NAME</p>
                                <p className="font-medium text-gray-800">{profile?.bankInfo?.accountHolderName || '-----'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">BANK ADDRESS</p>
                                <p className="font-medium text-gray-800">{profile?.bankInfo?.bankAddress || '-----'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">BANK MAIN BRANCH ADDRESS</p>
                                <p className="font-medium text-gray-800">{profile?.bankInfo?.bankBranch || '-----'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Invoice Email Preference */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Mail className="h-6 w-6 text-gray-700" />
                    <h3 className="text-xl font-bold text-gray-800">Contact Email</h3>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                    Where should invoices be sent?
                </p>

                <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="invoiceEmail"
                            checked={useExistingEmail}
                            onChange={() => setUseExistingEmail(true)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                            Send to Existing mail{' '}
                            <span className="text-gray-500">({profile?.primaryEmail || 'your email'})</span>
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="radio"
                            name="invoiceEmail"
                            checked={!useExistingEmail}
                            onChange={() => setUseExistingEmail(false)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
                        />
                        <div className="flex-1">
                            <span className="text-gray-700">Add other Email address</span>
                            {!useExistingEmail && (
                                <input
                                    type="email"
                                    value={invoiceEmail}
                                    onChange={(e) => setInvoiceEmail(e.target.value)}
                                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter email address for invoices"
                                />
                            )}
                        </div>
                    </label>
                </div>

                <div className="mt-4">
                    <button
                        onClick={handleSaveInvoicePreference}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving && <Loader2 className="animate-spin h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillingsTab;
