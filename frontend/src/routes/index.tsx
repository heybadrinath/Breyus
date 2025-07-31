import React from "react";
import { ReactNode } from "react";
import { SellerProtectedRoute, BuyerProtectedRoute } from "./ProtectedRoute";
import { Routes, Route, useLocation } from "react-router-dom";

// Main links
import { OnBoarding } from "../main/OnBoarding";
import { Login } from "../main/login";
import SelectRole from "../main/selectRole";
import ScheduleMeeting from "../main/scheduleMeeting";
import ForgotPassword from "../main/forgot-password";
import Hero from "../main/Hero";

import SellerDashboard from "../seller/pages/dashboard";
import Sales from "../seller/pages/sales";
import Upgrade from "../seller/pages/upgrade";
import { AddProduct } from "../seller/pages/add-product";
import { Inventory } from "../seller/pages/inventory";
import { Layout } from "../components/layout";

import Homepage from "../buyer/pages/Homepage";
import Wishlist from "../buyer/pages/Wishlist";
import ProductPage from "../buyer/pages/product";
import PurchaseRequestSuccess from "../buyer/pages/PurchaseRequestSuccess";

// AI imports
import BuyerAi from "../buyer/pages/ai";
import BuyerAiproduct from "../buyer/pages/ai-products";
import BuyerAiCountry from "../buyer/pages/ai-country";
import BuyerAiPort from "../buyer/pages/ai-port";
import BuyerAiResult from "../buyer/pages/ai-result";

// Seller AI Pages
import SellerSearchOption from "../seller/pages/SellerSearchOption";
import SellerSearchInput from "../seller/pages/SellerSearchInput";
import SellerSearchResult from "../seller/pages/SellerSearchResult";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";
import { easeIn, easeOut } from "framer-motion";

// Page transition animation
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: easeIn },
  },
};

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

        {/* Main routes */}
        <Route path="/onboarding" element={<Animate page={<OnBoarding />} />} />
        <Route path="/login" element={<Animate page={<Login />} />} />
        <Route path="/select-role" element={<Animate page={<SelectRole />} />} />
        <Route path="/schedule-meeting" element={<Animate page={<ScheduleMeeting />} />} />
        <Route path="/forgot-password" element={<Animate page={<ForgotPassword />} />} />

        {/* Buyer Routes */}
        <Route path="/buyer/homepage" element={
          <BuyerProtectedRoute>
            <Animate page={<Layout Buyer={true} Body={<Homepage />} />} />
          </BuyerProtectedRoute>
        } />
        <Route path="/buyer/wishlist" element={
          <BuyerProtectedRoute>
            <Animate page={<Layout Buyer={true} Body={<Wishlist />} />} />
          </BuyerProtectedRoute>
        } />
        <Route path="/buyer/product-page" element={
          <BuyerProtectedRoute>
            <Animate page={<Layout Buyer={true} Body={<ProductPage />} />} />
          </BuyerProtectedRoute>
        } />
        <Route path="/buyer/purchase-request-success" element={
          <BuyerProtectedRoute>
            <Animate page={<PurchaseRequestSuccess />} />
          </BuyerProtectedRoute>
        } />

        {/* Buyer AI Routes */}
        <Route path="/buyer/ai" element={<Animate page={<BuyerAi />} />} />
        <Route path="/buyer/ai-country" element={<Animate page={<BuyerAiCountry />} />} />
        <Route path="/buyer/ai-port" element={<Animate page={<BuyerAiPort />} />} />
        <Route path="/buyer/ai-result" element={<Animate page={<BuyerAiResult />} />} />
        <Route path="/buyer/ai-product" element={<Animate page={<BuyerAiproduct />} />} />

        {/* Seller Routes */}
        <Route path="/seller/dashboard" element={
          <SellerProtectedRoute>
            <Animate page={<Layout Seller={true} Body={<SellerDashboard />} />} />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/sales" element={
          <SellerProtectedRoute>
            <Animate page={<Layout Seller={true} Body={<Sales />} />} />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/upgrade" element={
          <SellerProtectedRoute>
            <Animate page={<Layout Seller={true} Body={<Upgrade />} />} />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/add-products" element={
          <SellerProtectedRoute>
            <Animate page={<Layout Seller={true} Body={<AddProduct />} />} />
          </SellerProtectedRoute>
        } />
        <Route path="/seller/inventory" element={
          <SellerProtectedRoute>
            <Animate page={<Layout Seller={true} Body={<Inventory />} />} />
          </SellerProtectedRoute>
        } />

        {/* Seller AI Pages */}
        <Route path="/seller/search-option" element={
            <Animate page={<Layout Seller={true} Body={<SellerSearchOption />} />} />
        } />
        <Route path="/seller/search-input" element={
            <Animate page={<Layout Seller={true} Body={<SellerSearchInput />} />} />
        } />
        <Route path="/seller/search-result" element={
            <Animate page={<Layout Seller={true} Body={<SellerSearchResult />} />} />
        } />

        {/* 404 Not Found */}
        <Route path="*" element={<Notfoundpage />} />

        {/* 500 Internal Error */}
        <Route path="/internal-error" element={
          <div className="shadow-2xl max-w-fit whitespace-nowrap flex p-5 my-72 mx-auto max-h-fit text-3xl rounded-lg text-center">
            Error code 500 <br /> Internal Server Error
          </div>
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
