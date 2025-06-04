import React, { JSX, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [backendUp, setBackendUp] = useState(true);

  useEffect(() => {
    const checkAuthAndBackend = async () => {
      try {
        // Backend health check
        await axios.get('http://localhost:5000/health');

        // Auth check (replace with your actual auth check)
        const token = localStorage.getItem('token');
        if (token) {
          setIsAuthed(true);
        }

      } catch (error) {
        console.error('API not reachable:', error);
        setBackendUp(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndBackend();
  }, []);

  if (loading) return null;

  if (!backendUp) return <Navigate to="/internal-error" />;

  if (!isAuthed) return <Navigate to="/buyer/signin" />;

  return children;
};

export default ProtectedRoute;
