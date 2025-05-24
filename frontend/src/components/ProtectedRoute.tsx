import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import authService from '../services/auth.service';

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/buyer/signin',
  children,
  requiredRole
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is authenticated
      const isAuth = authService.isAuthenticated();
      
      // If a token exists, validate it with the backend
      if (isAuth) {
        try {
          const isValid = await authService.validateTokenWithBackend();
          
          // If role is required, check if user has the required role
          if (requiredRole && isValid) {
            const hasRequiredRole = authService.hasRole(requiredRole);
            setIsAuthenticated(isValid && hasRequiredRole);
          } else {
            setIsAuthenticated(isValid);
          }
        } catch (error) {
          console.error('Token validation error:', error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [requiredRole]);

  if (isLoading) {
    // You could return a loading spinner here
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Save the current location they were trying to go to
    // Redirect to login page with a message
    return (
      <Navigate 
        to={redirectPath} 
        state={{ 
          from: location,
          message: "Error! Log in before proceeding." 
        }} 
        replace 
      />
    );
  }

  // If we have children, render them; otherwise, render the outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute; 