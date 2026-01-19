import React, { useState, useRef } from "react";
import { Camera, Upload, Loader2, X, Sparkles } from "lucide-react";
import {
    CompanyProfile,
    uploadProfilePicture,
    uploadBanner,
    deleteProfilePicture,
    deleteBanner
} from "../../services/company.service";

interface ProfileHeaderProps {
    profile: CompanyProfile | null;
    userEmail: string;
    onUpdate: (profile: CompanyProfile) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, userEmail, onUpdate }) => {
    const [isUploadingProfile, setIsUploadingProfile] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [isDraggingBanner, setIsDraggingBanner] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const profileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const handleProfilePictureUpload = async (file: File) => {
        try {
            setIsUploadingProfile(true);
            setError(null);

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select an image file');
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Image must be less than 5MB');
            }

            const result = await uploadProfilePicture(file);
            onUpdate({ ...profile, profilePicture: result.profilePicture });
        } catch (err: any) {
            console.error('Error uploading profile picture:', err);
            setError(err.message || 'Failed to upload profile picture');
        } finally {
            setIsUploadingProfile(false);
        }
    };

    const handleBannerUpload = async (file: File) => {
        try {
            setIsUploadingBanner(true);
            setError(null);

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select an image file');
            }

            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('Banner image must be less than 10MB');
            }

            const result = await uploadBanner(file);
            onUpdate({ ...profile, bannerImage: result.bannerImage });
        } catch (err: any) {
            console.error('Error uploading banner:', err);
            setError(err.message || 'Failed to upload banner image');
        } finally {
            setIsUploadingBanner(false);
        }
    };

    const handleDeleteProfilePicture = async () => {
        try {
            setIsUploadingProfile(true);
            setError(null);
            await deleteProfilePicture();
            onUpdate({ ...profile, profilePicture: undefined });
        } catch (err: any) {
            console.error('Error deleting profile picture:', err);
            setError(err.message || 'Failed to delete profile picture');
        } finally {
            setIsUploadingProfile(false);
        }
    };

    const handleDeleteBanner = async () => {
        try {
            setIsUploadingBanner(true);
            setError(null);
            await deleteBanner();
            onUpdate({ ...profile, bannerImage: undefined });
        } catch (err: any) {
            console.error('Error deleting banner:', err);
            setError(err.message || 'Failed to delete banner image');
        } finally {
            setIsUploadingBanner(false);
        }
    };

    const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleProfilePictureUpload(file);
        }
    };

    const handleBannerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleBannerUpload(file);
        }
    };

    const handleBannerDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingBanner(true);
    };

    const handleBannerDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingBanner(false);
    };

    const handleBannerDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingBanner(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleBannerUpload(file);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-3 flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Banner */}
            <div
                className={`relative h-44 bg-gradient-to-r from-blue-500 to-purple-600 transition-all ${
                    isDraggingBanner ? 'ring-4 ring-blue-300 ring-inset' : ''
                }`}
                onDragOver={handleBannerDragOver}
                onDragLeave={handleBannerDragLeave}
                onDrop={handleBannerDrop}
            >
                {profile?.bannerImage ? (
                    <img
                        src={profile.bannerImage}
                        alt="Banner"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white/50 text-sm font-medium flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Drop image here or click to upload banner
                        </div>
                    </div>
                )}

                {/* Banner overlay for upload */}
                <div
                    className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all cursor-pointer group flex items-center justify-center"
                    onClick={() => !isUploadingBanner && bannerInputRef.current?.click()}
                >
                    {isUploadingBanner ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white font-medium">
                            <Camera className="h-5 w-5" />
                            Change Banner
                        </div>
                    )}
                </div>

                {/* Delete banner button */}
                {profile?.bannerImage && !isUploadingBanner && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBanner();
                        }}
                        className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-sm opacity-0 hover:opacity-100 transition-opacity"
                        title="Remove banner"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}

                <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerInputChange}
                    className="hidden"
                />
            </div>

            {/* Profile Section */}
            <div className="relative px-6 pb-6">
                {/* Profile Picture */}
                <div className="absolute -top-12 left-6">
                    <div className="relative">
                        <div
                            className={`w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 cursor-pointer group ${
                                isUploadingProfile ? 'opacity-50' : ''
                            }`}
                            onClick={() => !isUploadingProfile && profileInputRef.current?.click()}
                        >
                            {profile?.profilePicture ? (
                                <img
                                    src={profile.profilePicture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {getInitials(profile?.companyName || userEmail)}
                                </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                {isUploadingProfile ? (
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </div>
                        </div>

                        {/* Delete profile picture button */}
                        {profile?.profilePicture && !isUploadingProfile && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProfilePicture();
                                }}
                                className="absolute -top-1 -right-1 bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 p-1 rounded-full shadow-sm border border-gray-200"
                                title="Remove profile picture"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}

                        <input
                            ref={profileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleProfileInputChange}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* User Info */}
                <div className="pt-14 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-800">
                                {profile?.companyName || 'Your Company'}
                            </h2>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium rounded-full">
                                <Sparkles className="h-3 w-3" />
                                Breyus AI
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">{userEmail}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
