import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    path?: string;
    className?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, path, className = '' }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (path) {
            navigate(path);
        }
    };

    return (
        <div
            className={`flex w-fit cursor-pointer px-10 py-2 rounded-xl hover:bg-[#00000021] transition-colors ${className}`}
            onClick={handleClick}
        >
            <div className='mr-4'>{icon}</div>
            <span className="text-md font-medium">{label}</span>
        </div>
    );
};

export default SidebarItem;