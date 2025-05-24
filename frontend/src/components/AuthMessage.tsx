import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const AuthMessage: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if there's a message in the location state
    if (location.state && 'message' in location.state) {
      setMessage(location.state.message as string);
      
      // Clear the message after 5 seconds
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);

  if (!message) return null;

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

export default AuthMessage; 