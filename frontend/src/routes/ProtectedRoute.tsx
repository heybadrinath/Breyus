import React, { JSX, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const BuyerProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);


  useEffect(() => {
    const checkAuthAndBackend = async () => {
      try {
        await axios.get('http://localhost:5000/health');

        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuthed(false);
          setLoading(false);
          return;
        }

        const res = await axios.get('http://localhost:5000/auth/validate-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.valid) {
          setIsAuthed(true);
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
  if (!isAuthed) return <Navigate to="/buyer/signin" />;
  return children;
};



const SellerProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  

  useEffect(() => {
    const checkAuthAndBackend = async () => {
      try {
        await axios.get('http://localhost:5000/health');

        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuthed(false);
          setLoading(false);
          return;
        }

        const res = await axios.get('http://localhost:5000/auth/validate-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.valid) {
          setIsAuthed(true);
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
  if (!isAuthed) return <Navigate to="/seller/signin" />;
  return children;
};


export { BuyerProtectedRoute, SellerProtectedRoute };
