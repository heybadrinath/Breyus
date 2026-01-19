import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getCompanyProfile, CompanyProfile } from "../../services/company.service";
import SettingsTabs, { Tab } from "../../components/SettingsTabs";
import MyDetailsTab from "../../components/settings/MyDetailsTab";
import TradeDetailsTab from "../../components/settings/TradeDetailsTab";
import NotificationsTab from "../../components/settings/NotificationsTab";
import SecurityAccessTab from "../../components/settings/SecurityAccessTab";
import BillingsTab from "../../components/settings/BillingsTab";
import PlansTab from "../../components/settings/PlansTab";

const SettingsContent = () => {
    const [profile, setProfile] = useState<CompanyProfile | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
        fetchUserEmail();
    }, []);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getCompanyProfile();
            setProfile(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserEmail = async () => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URL}/users/return-name`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                }
            );
            if (response.ok) {
                const data = await response.json();
                setUserEmail(data.name || '');
            }
        } catch (err) {
            console.error('Error fetching user email:', err);
        }
    };

    const handleProfileUpdate = (updatedProfile: CompanyProfile) => {
        setProfile(prev => ({ ...prev, ...updatedProfile }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-gray-500 mb-4" />
                <p className="text-gray-500">Loading profile information...</p>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={fetchProfile}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    const tabs: Tab[] = [
        {
            id: 'my-details',
            label: 'My Details',
            component: <MyDetailsTab profile={profile} userEmail={userEmail} onUpdate={handleProfileUpdate} />
        },
        {
            id: 'security',
            label: 'Security & Access',
            component: <SecurityAccessTab userEmail={userEmail} />
        },
        {
            id: 'billings',
            label: 'Billings',
            component: <BillingsTab profile={profile} onUpdate={handleProfileUpdate} />
        },
        {
            id: 'plans',
            label: 'Plans',
            component: <PlansTab />
        },
        {
            id: 'notifications',
            label: 'Notifications',
            component: <NotificationsTab userEmail={userEmail} />
        },
        {
            id: 'trade-details',
            label: 'Trade Details',
            component: <TradeDetailsTab profile={profile} onUpdate={handleProfileUpdate} />
        }
    ];

    return (
        <div className="settings-container w-[96%] my-12 mx-auto">
            <SettingsTabs tabs={tabs} defaultTab="my-details" />
        </div>
    );
};

const BuyerSettings = () => {
    return <SettingsContent />;
};

export default BuyerSettings;
