import React, { useState, useEffect, ReactNode } from 'react';
import { checkMaintenanceStatus, MaintenanceStatus } from '../services/maintenance.service';
import { MaintenancePage } from '../main/MaintenancePage';

interface MaintenanceWrapperProps {
  children: ReactNode;
  checkInterval?: number; // in milliseconds
}

export const MaintenanceWrapper: React.FC<MaintenanceWrapperProps> = ({
  children,
  checkInterval = 60000, // Check every 60 seconds
}) => {
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const status = await checkMaintenanceStatus();
      setMaintenanceStatus(status);
    } catch (error) {
      console.error('Error checking maintenance status:', error);
      // On error, assume not in maintenance to avoid blocking users
      setMaintenanceStatus({ isActive: false, message: '' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkStatus();

    // Set up periodic checks
    const interval = setInterval(checkStatus, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval]);

  // Show loading briefly on first check
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
      </div>
    );
  }

  // Show maintenance page if maintenance is active
  if (maintenanceStatus?.isActive) {
    return (
      <MaintenancePage
        message={maintenanceStatus.message}
        estimatedEndTime={maintenanceStatus.estimatedEndTime}
      />
    );
  }

  // Otherwise, render children normally
  return <>{children}</>;
};

export default MaintenanceWrapper;
