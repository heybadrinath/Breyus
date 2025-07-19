import React from "react";
import { ReactNode } from "react";
import { SellerProtectedRoute, BuyerProtectedRoute } from "./ProtectedRoute"; // Protected Route for authenticated users
import { Routes, Route, useLocation } from "react-router-dom";




// Main links
import { OnBoarding } from "../main/OnBoarding";
import { Login } from "../main/login";
import SelectRole from "../main/selectRole";
import ScheduleMeeting from "../main/scheduleMeeting";

import Hero from "../main/Hero";
import SellerSettings from "../seller/settings";
import SellerDashboard from "../seller/dashboard";
import Security from "../seller/security";
import { motion, AnimatePresence } from "framer-motion";
import Sales from "../seller/sales";
import Upgrade from "../seller/upgrade";
import { AddProduct } from "../seller/Products/add-product";
import ForgotPassword from "../buyer/forgot-password";
import BuyerLayout from "../buyer/components/layout";


import SellerForgotPassword from "../seller/forgot-password";
import { Layout } from "../seller/components";
import Inbox from "../seller/inbox";
import { Trade, Feedback } from "../seller/trade";

import BuyerInbox from "../buyer/pages/Inbox";
import Homepage from "../buyer/pages/Homepage";
import Wishlist from "../buyer/pages/Wishlist";
import CartPage from "../buyer/pages/Cartpage";
import BuyerTrade from "../buyer/pages/trade";
import ProductPage from "../buyer/pages/product";
import OrderRequestQuantity from "../buyer/pages/order_request_quantity";
import BuyerInformation from "../buyer/pages/buyer_information";
import BuyerAddress from "../buyer/pages/buyer_address";
import PurchaseRequest from "../buyer/pages/purchase-request";
import PurchaseRequestSuccess from "../buyer/pages/PurchaseRequestSuccess";
import { Inventory } from "../seller/Products/inventory";

// ai imports 
import BuyerAi from "../buyer/pages/ai";
import BuyerAiproduct from "../buyer/pages/ai-products";

// const pageVariants = { 
//   initial: { opacity: 0 },
//   animate: { opacity: 1, transition: { duration: 0.4 } },
//   exit: { opacity: 0, transition: { duration: 0.4 } }
// };

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: "easeIn" },
  },
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
        {/* <Route path="/" element={<Animate page={<Hero />} />} /> */}
        <Route path="/" element={<Animate page={<Hero />} />} />



        {/* Main routes */}
        <Route path="/onboarding" element={<Animate page={<OnBoarding />} />} />
        <Route path="/login" element={<Animate page={<Login />} />} />
        <Route path="/select-role" element={<Animate page={<SelectRole />} />} />
        <Route path="/schedule-meeting" element={<Animate page={<ScheduleMeeting />} />} />



        {/* Buyer Routes */}
        <Route path="/buyer/forgot-password" element={<Animate page={<ForgotPassword />} />} />

        <Route path="/buyer/homepage" element={<BuyerProtectedRoute><Animate page={<Homepage />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/inbox" element={<BuyerProtectedRoute><Animate page={<BuyerLayout content={<BuyerInbox />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/wishlist" element={<BuyerProtectedRoute><Animate page={<Wishlist />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/cartpage" element={<BuyerProtectedRoute><Animate page={<CartPage />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/trade" element={<BuyerProtectedRoute><Animate page={<BuyerLayout content={<BuyerTrade />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/buyer-address" element={<BuyerProtectedRoute><Animate page={<BuyerAddress />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/product-page" element={<BuyerProtectedRoute><Animate page={<BuyerLayout content={<ProductPage />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/product-request-quantity" element={<BuyerProtectedRoute><Animate page={<BuyerLayout content={<OrderRequestQuantity />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/buyer-information" element={<BuyerProtectedRoute><Animate page={<BuyerLayout content={<BuyerInformation />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/purchase-request" element={<BuyerProtectedRoute><Animate page={<PurchaseRequest />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/purchase-request-success" element={<BuyerProtectedRoute><Animate page={<PurchaseRequestSuccess />} /></BuyerProtectedRoute>} />

        {/* AI Routes */}
        <Route path="/buyer/ai" element={<Animate page={<BuyerAi />} />} />
        <Route path="/buyer/ai-product" element={<Animate page={<BuyerAiproduct />} />} />




        {/* Seller Routes */}
        <Route path="/seller/forgot-password" element={<Animate page={<SellerForgotPassword />} />} />

        <Route path="/seller/dashboard" element={<SellerProtectedRoute><Animate page={<Layout Body={<SellerDashboard />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/security" element={<SellerProtectedRoute><Animate page={<Layout Body={<Security />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/sales" element={<SellerProtectedRoute><Animate page={<Layout Body={<Sales />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/upgrade" element={<SellerProtectedRoute><Animate page={<Layout Body={<Upgrade />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/add-products" element={<SellerProtectedRoute><Animate page={<Layout Body={<AddProduct />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/Inbox" element={<SellerProtectedRoute><Animate page={<Layout Body={<Inbox />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/trade" element={<SellerProtectedRoute><Animate page={<Layout Body={<Trade />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/Product-Feedback" element={<SellerProtectedRoute><Animate page={<Layout Body={<Feedback />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/inventory" element={<SellerProtectedRoute><Animate page={<Layout Body={<Inventory />} />} /></SellerProtectedRoute>} />




        {/* Seller settings with default layout */}

        {/* Seller settings with different layout */}
        <Route path="/seller/settings" element={<SellerProtectedRoute><Animate page={<SellerSettings />} /></SellerProtectedRoute>} />



        {/* 404 page  */}
        <Route path="*" element={<Notfoundpage />} />

        {/* Internal Error  */}
        <Route path="/internal-error" element={<div className="shadow-2xl max-w-fit whitespace-nowrap flex p-5 my-72 mx-auto max-h-fit text-3xl rounded-lg text-center">Error code 500 <br /> Internal Server Error</div>} />
      </Routes>


    </AnimatePresence>
  );
};

export default AppRoutes;
