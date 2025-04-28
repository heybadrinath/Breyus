import React from 'react';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
  }
  
  const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label }) => {
    return (
      <div className="flex items-center space-x-4 cursor-pointer hover:text-gray-700 transition-colors">
        <div>{icon}</div>
        <span className="text-md font-medium">{label}</span>
      </div>
    );
  };
  
  export default SidebarItem;