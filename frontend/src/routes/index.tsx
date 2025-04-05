import React from "react";
import { ReactNode } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Signin from "../buyer/signin";  // Buyer Signin
import Signup from "../buyer/signup";  // Buyer Signup
import SellerSignin from "../seller/signin";  // Seller Signin
import SellerSignup from "../seller/signup";  // Seller Signup
import Hero from "../main/hero";  // Hero Page
import SellerSettings from "../seller/settings";
import SellerDashboard from "../seller/dashboard";
import Security from "../seller/security";
import { motion, AnimatePresence } from "framer-motion";
import Sales from "../seller/sales";
import Upgrade from "../seller/upgrade";
import Products from "../seller/products";
import ForgotPassword from "../buyer/forgot-password";
import BuyerDashboard from "../buyer/dashboard";
import SellerForgotPassword from "../seller/forgot-password";

const pageVariants = {
  initial: { opacity: 0, x: -80 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: 80, transition: { duration: 0.4 } }
};

// wrapper for seller div is already available 
const Animate = ({ page }: { page: ReactNode }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {page}
    </motion.div>
  );
};

// Wrapper for seller dashboard pages that includes layout


const Notfoundpage = () => {
  return (
    <div className="shadow-2xl max-w-fit whitespace-nowrap flex p-5 my-72 mx-auto max-h-fit text-3xl">
      404 Error Page not found
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

        {/* Buyer Routes */}
        <Route path="/buyer/signin" element={<Animate page={<Signin />} />} />
        <Route path="/buyer/signup" element={<Animate page={<Signup />} />} />
        <Route path="/buyer/forgot-password" element={<Animate page={<ForgotPassword />} />} />
        <Route path="/buyer/dashboard" element={<Animate page={<BuyerDashboard />} />} />

        {/* Seller Routes */}
        <Route path="/seller/signin" element={<Animate page={<SellerSignin />} />} />
        <Route path="/seller/signup" element={<Animate page={<SellerSignup />} />} />
        <Route path="/seller/forgot-password" element={<Animate page={<SellerForgotPassword />} />} />
        <Route path="/seller/dashboard" element={<Animate page={<SellerDashboard />} />} />
        <Route path="/seller/security" element={<Animate page={<Security />} />} />
        <Route path="/seller/settings" element={<Animate page={<SellerSettings />} />} />
        <Route path="/seller/sales" element={<Animate page={<Sales />} />} />
        <Route path="/seller/upgrade" element={<Animate page={<Upgrade />} />} />
        <Route path="/seller/product" element={<Animate page={<Products/>} />} />


        {/* 404 page  */}
        <Route path="*" element={<Notfoundpage />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
