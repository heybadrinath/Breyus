import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    path?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, path }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (path) {
            navigate(path);
        }
    };

    return (
        <div 
            className="flex items-center space-x-4 cursor-pointer hover:text-gray-700 transition-colors"
            onClick={handleClick}
        >
            <div>{icon}</div>
            <span className="text-md font-medium">{label}</span>
        </div>
    );
};

export default SidebarItem;