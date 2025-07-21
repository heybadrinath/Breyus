import { HelpCircle, Settings } from "lucide-react";
import React from 'react';


const SidebarBottom: React.FC = () => {
  return (
    <div className="px-6 mb-8 space-y-6 mx-auto">
      <div className="flex items-center space-x-4 cursor-pointer hover:text-gray-700 transition-colors">
        <HelpCircle size={22} />
        <span className="text-md font-medium">Help & Support</span>
      </div>

      <div className="flex items-center space-x-4 cursor-pointer hover:text-gray-700 transition-colors">
        <Settings size={22} />
        <span className="text-md font-medium">Settings</span>
      </div>
    </div>
  );
};

export default SidebarBottom;