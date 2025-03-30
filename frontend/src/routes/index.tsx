import React from "react";
import { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Link, Navigate } from "react-router-dom";
import Signin from "../buyer/signin";  // Buyer Signin
import Signup from "../buyer/signup";  // Buyer Signup
import ForgotPassword from "../buyer/forgot-password"; // Buyer Forgot Password
import BuyerDashboard from "../buyer/dashboard"; // Buyer Dashboard
import SellerSignin from "../seller/signin";  // Seller Signin
import SellerSignup from "../seller/signup";  // Seller Signup
import SellerForgotPassword from "../seller/forgot-password"; // Seller Forgot Password
import Hero from "../main/hero";  // Hero Page
import SellerSettings from "../seller/settings";
import SellerDashboard from "../seller/dashboard";
import Security from "../seller/security";
import ProtectedRoute from "./ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";
import { Leftnavdash, Header } from "../seller/components";

let username = "Demo user";

const pageVariants = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: 50, transition: { duration: 0.4 } }
};

const Animate = ({ page }: { page: ReactNode }) => {

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">  {page} </motion.div>
  );
};

const Notfoundpage = () => {
  return (
    <div className="layout max-h-fit">
      <Leftnavdash username={username} />
      <div id="right-section">
        <Header />

        <div className="shadow-2xl max-w-fit whitespace-nowrap flex p-5 my-72 mx-auto max-h-fit text-3xl">
          404 Error Page not found
        </div>

      </div>
    </div>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  return (

    <AnimatePresence mode="wait">

      <Routes location={location} key={location.pathname}>
        {/* Hero Page */}
        <Route path="/" element={<Animate page={<Hero />} />} />

        {/* Redirects */}
        <Route path="/forgot-password" element={<Navigate to="/seller/forgot-password" replace />} />

        {/* Buyer Routes */}
        <Route path="/buyer/signin" element={<Animate page={<Signin />} />} />
        <Route path="/buyer/signup" element={<Animate page={<Signup />} />} />
        <Route path="/buyer/forgot-password" element={<Animate page={<ForgotPassword />} />} />
        <Route 
          path="/buyer/dashboard" 
          element={
            <ProtectedRoute requiredRole="buyer">
              <Animate page={<BuyerDashboard />} />
            </ProtectedRoute>
          } 
        />

        {/* Seller Routes */}
        <Route path="/seller/signin" element={<Animate page={<SellerSignin />} />} />
        <Route path="/seller/signup" element={<Animate page={<SellerSignup />} />} />
        <Route path="/seller/forgot-password" element={<Animate page={<SellerForgotPassword />} />} />
        <Route 
          path="/seller/dashboard" 
          element={
            <ProtectedRoute requiredRole="seller">
              <Animate page={<SellerDashboard />} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/security" 
          element={
            <ProtectedRoute requiredRole="seller">
              <Animate page={<Security />} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/settings" 
          element={
            <ProtectedRoute requiredRole="seller">
              <Animate page={<SellerSettings />} />
            </ProtectedRoute>
          } 
        />

        {/* 404 page  */}
        <Route path="*" element={<Notfoundpage />} />
      </Routes>

    </AnimatePresence>

  );
};

export default AppRoutes;
