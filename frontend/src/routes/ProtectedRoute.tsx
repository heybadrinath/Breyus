import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/auth.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateAccess = async () => {
      try {
        console.log('ProtectedRoute - Path:', location.pathname, 'Required role:', requiredRole);
        console.log('ProtectedRoute - localStorage check:', {
          token: localStorage.getItem('token') ? 'exists' : 'missing',
          user: localStorage.getItem('user')
        });
        
        // Check token with backend to ensure it's valid
        const isValidToken = await authService.validateTokenWithBackend();
        console.log('ProtectedRoute - Backend token validation:', isValidToken);
        
        if (!isValidToken) {
          console.log('ProtectedRoute - Token invalid or expired');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // If a role is required, check if user has that role
        if (requiredRole) {
          const hasRequiredRole = authService.hasRole(requiredRole);
          console.log('ProtectedRoute - Role check:', { requiredRole, hasRequiredRole });
          setIsAuthenticated(hasRequiredRole);
        } else {
          console.log('ProtectedRoute - No role required, authenticated');
          setIsAuthenticated(true);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('ProtectedRoute - Authentication error:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    validateAccess();
  }, [requiredRole, location.pathname]);

  if (isLoading) {
    console.log('ProtectedRoute - Loading state');
    // Show a loading spinner
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to login page with the return url
  if (!isAuthenticated) {
    // Determine which login page to redirect to based on the required role
    const loginPath = requiredRole === 'seller' ? '/seller/signin' : '/buyer/signin';
    console.log('ProtectedRoute - Not authenticated, redirecting to:', loginPath);
    
    // Comment out redirect
    // return <Navigate to={loginPath} state={{ from: location }} replace />;
    
    // Show unauthorized message instead of redirecting
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-4">
          <h1 className="text-xl font-bold mb-2">Authentication Required</h1>
          <p>You need to be logged in to view this page.</p>
          <p>Redirection temporarily disabled for debugging.</p>
        </div>
      </div>
    );
  }

  // If authenticated and has the required role, render the children
  console.log('ProtectedRoute - Authentication successful, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute; 