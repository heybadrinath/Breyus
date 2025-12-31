import React, { JSX, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const Backend_URL = process.env.REACT_APP_BACKEND_URL;


const BuyerProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

 useEffect(() => {
    const checkAuthAndBackend = async () => {
      try {
      await fetch(`${Backend_URL}/health`, { credentials: 'include' });

      const res = await fetch(`${Backend_URL}/auth/validate-cookie`, {
        credentials: 'include',
      });

      const data = await res.json();

      if (data.valid) {
        if(data.role === 'Seller') {
          setIsAuthed(false);
        } else {
          setIsAuthed(true);
        }
      } else {
        setIsAuthed(false);
      }
      } catch (err) {
      setIsAuthed(false);
      } finally {
      setLoading(false);
      }
    };

    checkAuthAndBackend();
  }, []);

  if (loading) return <div className='w-fit m-auto h-fit mt-[40vh]'>Loading.....</div>;
  if (!isAuthed) return <Navigate to="/login" />;
  return children;
};



const SellerProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  

  useEffect(() => {
    const checkAuthAndBackend = async () => {
      try {
      await fetch(`${Backend_URL}/health`, { credentials: 'include' });

      const res = await fetch(`${Backend_URL}/auth/validate-cookie`, {
        credentials: 'include',
      });

      const data = await res.json();

      if (data.valid) {
        if(data.role === 'Buyer') {
          setIsAuthed(false);
        } else {
          setIsAuthed(true);
        }
      } else {
        setIsAuthed(false);
      }
    } catch (err) {
      setIsAuthed(false);
      } finally {
      setLoading(false);
      }
    };

    checkAuthAndBackend();
  }, []);

  if (loading) return <div className='w-fit m-auto h-fit mt-[40vh]'>Loading.....</div>;
  if (!isAuthed) return <Navigate to="/login" />;
  return children;
};


export { BuyerProtectedRoute, SellerProtectedRoute };
