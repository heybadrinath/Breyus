import React, { ReactNode } from "react";
import { SellerProtectedRoute, BuyerProtectedRoute } from "./ProtectedRoute"; // Protected Route for authenticated users
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "../components/layout";




// Main links
import Hero from "../main/Hero";
import { OnBoarding } from "../main/OnBoarding";
import { Login } from "../main/login";
import SelectRole from "../main/selectRole";
import ScheduleMeeting from "../main/scheduleMeeting";
import ForgotPassword from "../main/forgot-password";



// Seller links
import SellerDashboard from "../seller/pages/dashboard";
import Sales from "../seller/pages/sales";
import Upgrade from "../seller/pages/upgrade";
import { AddProduct } from "../seller/pages/add-product";
import { Inventory } from "../seller/pages/inventory";
import { Feedback } from "../seller/pages/feedback";
import Inbox from "../seller/pages/inbox";
import { Trade } from "../seller/pages/trade";






// Buyer links
import Homepage from "../buyer/pages/Homepage";
import ProductPage from "../buyer/pages/product";
import { PurchaseRequest } from "../buyer/pages/purchase-request"
import BuyerInbox from "../buyer/pages/Inbox";
import { Trade as BuyerTrade } from "../buyer/pages/trade";
import Wishlist from "../buyer/pages/Wishlist";



// ai imports 
import BuyerAi from "../buyer/pages/ai";
import BuyerAiproduct from "../buyer/pages/ai-products";



const pageVariants = {
  initial: { opacity: 0.5, y: 5 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: { duration: 0.1, ease: "easeIn" },
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
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-screen w-screen">
      <div className="shadow-2xl max-w-fit whitespace-nowrap rounded-lg mt-[20vh] flex p-5 mx-auto max-h-fit text-3xl flex-col">
        404 Error Page not found
      </div>
      <button className="flex bg-black w-fit text-white px-4 py-2 mt-6 rounded-lg mx-auto" onClick={() => navigate('/')}>Go to Homepage</button>

    </div>

  );
};


const AppRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">

      <Routes location={location} key={location.pathname}>
        {/* Main routes */}
        <Route path="/" element={<Animate page={<Hero />} />} />
        <Route path="/onboarding" element={<Animate page={<OnBoarding />} />} />
        <Route path="/login" element={<Animate page={<Login />} />} />
        <Route path="/select-role" element={<Animate page={<SelectRole />} />} />
        <Route path="/schedule-meeting" element={<Animate page={<ScheduleMeeting />} />} />
        <Route path="/forgot-password" element={<Animate page={<ForgotPassword />} />} />



        {/* Buyer Routes */}
        <Route path="/buyer/homepage" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<Homepage />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/product-page" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<ProductPage />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/purchase-request" element={<BuyerProtectedRoute><Animate page={<PurchaseRequest />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/inbox" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<BuyerInbox />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/wishlist" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<Wishlist />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/trade" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<BuyerTrade />} />} /></BuyerProtectedRoute>} />





        {/* Seller Routes */}
        <Route path="/seller/dashboard" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerDashboard />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/sales" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Sales />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/upgrade" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Upgrade />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/add-products" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<AddProduct />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/inventory" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Inventory />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/Product-Feedback" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Feedback />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/Inbox" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Inbox />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/trade" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Trade />} />} /></SellerProtectedRoute>} />




        {/* AI Routes */}
        <Route path="/buyer/ai" element={<Animate page={<BuyerAi />} />} />
        <Route path="/buyer/ai-product" element={<Animate page={<BuyerAiproduct />} />} />


        {/* Essential Error routes */}
        <Route path="*" element={<Animate page={<Notfoundpage />} />} />
        <Route path="/internal-error" element={<div className="shadow-2xl max-w-fit whitespace-nowrap flex p-5 my-72 mx-auto max-h-fit text-3xl rounded-lg text-center">Error code 500 <br /> Internal Server Error</div>} />

      </Routes>


    </AnimatePresence>
  );
};

export default AppRoutes;
