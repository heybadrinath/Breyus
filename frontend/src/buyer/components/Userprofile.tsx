import React from 'react';



interface UserProfileProps {
    name: string;
  }
  
  const UserProfile: React.FC<UserProfileProps> = ({ name }) => {
    return (
      <div className="flex items-center px-6 py-4">
        <div className="w-10 h-10 rounded-full bg-black"></div>
        <div className="ml-4 text-base font-semibold text-gray-800 capitalize">{name}</div>
      </div>
    );
  };
  
  export default UserProfile;