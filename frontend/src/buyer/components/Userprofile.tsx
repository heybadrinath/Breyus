import React from 'react';



interface UserProfileProps {
    name: string;
    className?: string;
  }
  
  const UserProfile: React.FC<UserProfileProps> = ({ name, className = '' }) => {
    return (
      <div style={{
        borderTop: '1.6px solid transparent',
        borderBottom: '1.6px solid transparent',
        borderImage: 'linear-gradient(to left, #ECECEC, #0000007e, #ECECEC) 1',
        borderLeft: 'none',
        borderRight: 'none'
      }} className={`flex items-center w-fit mx-auto border px-6 py-4 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-black"></div>
        <div className="ml-4 text-base font-semibold text-gray-800 capitalize">{name}</div>
      </div>
    );
  };
  
  export default UserProfile;