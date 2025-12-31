import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getCompanyProfile, CompanyProfile } from "../../services/company.service";
import SettingsTabs, { Tab } from "../../components/SettingsTabs";
import MyDetailsTab from "../../components/settings/MyDetailsTab";
import TradeDetailsTab from "../../components/settings/TradeDetailsTab";
import NotificationsTab from "../../components/settings/NotificationsTab";

// Placeholder components for tabs that are not yet implemented
const PlaceholderTab: React.FC<{ title: string }> = ({ title }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500">This feature is coming soon.</p>
    </div>
);

const SettingsContent = () => {
    const [profile, setProfile] = useState<CompanyProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
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
            component: <MyDetailsTab profile={profile} onUpdate={handleProfileUpdate} />
        },
        {
            id: 'security',
            label: 'Security & Access',
            component: <PlaceholderTab title="Security & Access" />
        },
        {
            id: 'billings',
            label: 'Billings',
            component: <PlaceholderTab title="Billings" />
        },
        {
            id: 'plans',
            label: 'Plans',
            component: <PlaceholderTab title="Plans" />
        },
        {
            id: 'notifications',
            label: 'Notifications',
            component: <NotificationsTab />
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
