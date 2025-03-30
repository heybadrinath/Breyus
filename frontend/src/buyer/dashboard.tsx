import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateAndLoadUser = async () => {
      try {
        console.log('BuyerDashboard - Validating token with backend');
        const isValidToken = await authService.validateTokenWithBackend();
        
        if (!isValidToken) {
          console.log('BuyerDashboard - Invalid token, redirecting to login');
          navigate('/buyer/signin');
          return;
        }
        
        const userData = authService.getUser();
        console.log('BuyerDashboard - User data:', userData);
        
        if (!userData || userData.role !== 'buyer') {
          console.log('BuyerDashboard - User is not a buyer, redirecting to login');
          authService.logout();
          navigate('/buyer/signin');
          return;
        }

        setUser(userData);
        setIsLoading(false);
      } catch (error) {
        console.error('BuyerDashboard - Error:', error);
        navigate('/buyer/signin');
      }
    };

    validateAndLoadUser();
  }, [navigate]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Buyer Dashboard</h1>
        
        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-xl font-medium mb-3">Welcome, {user.firstName || 'Buyer'}!</h2>
            <p className="text-gray-700">Your account is active and ready for shopping.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-6 rounded-md">
            <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
            <p className="text-gray-600">No recent activities</p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-md">
            <h3 className="text-lg font-medium mb-2">Account Summary</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user.email}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Account Type:</span>
                <span className="font-medium">Buyer</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-md mb-8">
          <h3 className="text-lg font-medium mb-2">What's New</h3>
          <p className="text-gray-700 mb-2">
            Welcome to your new dashboard! Here you can track your orders, manage your profile, and discover new products.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200">
            Explore Products
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-md text-center hover:bg-gray-100 transition duration-200 cursor-pointer">
            <h3 className="font-medium mb-1">My Orders</h3>
            <p className="text-gray-600 text-sm">View your order history</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md text-center hover:bg-gray-100 transition duration-200 cursor-pointer">
            <h3 className="font-medium mb-1">Saved Items</h3>
            <p className="text-gray-600 text-sm">View your wishlist</p>
          </div>
          
          <div 
            className="bg-gray-50 p-4 rounded-md text-center hover:bg-gray-100 transition duration-200 cursor-pointer"
            onClick={() => {
              authService.logout();
              navigate('/buyer/signin');
            }}
          >
            <h3 className="font-medium mb-1">Logout</h3>
            <p className="text-gray-600 text-sm">Sign out of your account</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
