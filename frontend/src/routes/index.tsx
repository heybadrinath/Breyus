import React from "react";
import { ReactNode } from "react";
import {SellerProtectedRoute, BuyerProtectedRoute} from "./ProtectedRoute"; // Protected Route for authenticated users
import { Routes, Route, useLocation } from "react-router-dom";


// Signin imports
import Signin from "../buyer/signin";  // Buyer Signin
import SellerSignin from "../seller/signin";  // Seller Signin

import Signup from "../buyer/signup";  // Buyer Signup
import SellerSignup from "../seller/signup";  // Seller Signup

// Onboarding
import { OnBoarding } from "../main/OnBoarding";

import Hero from "../main/Hero";
import SellerSettings from "../seller/settings";
import SellerDashboard from "../seller/dashboard";
import Security from "../seller/security";
import { motion, AnimatePresence } from "framer-motion";
import Sales from "../seller/sales";
import Upgrade from "../seller/upgrade";
import {AddProduct, Inventory, Incoterms} from "../seller/products";
import ForgotPassword from "../buyer/forgot-password";
import BuyerLayout from "../buyer/components/layout";


import SellerForgotPassword from "../seller/forgot-password";
import { Layout } from "../seller/components";
import Inbox from "../seller/inbox"; 
import {Trade,Feedback} from "../seller/trade";
import SellerAddProductTerms from "../seller/add-products-trade-terms";

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

// ai imports 
import BuyerAi from "../buyer/pages/ai";
import BuyerAiproduct from "../buyer/pages/ai-products";

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
          {/* <Route path="/" element={<Animate page={<Hero />} />} /> */}
          <Route path="/" element={<Animate page={<Hero />}/>} />



          {/* OnBoarding */}
          <Route path="/onboarding" element={<Animate page={<OnBoarding />} />} />

         
  
          {/* Buyer Routes */}
            <Route path="/buyer/signin" element={<Animate page={<Signin />} />} />
            <Route path="/buyer/signup" element={<Animate page={<Signup />} />} />
            <Route path="/buyer/forgot-password" element={<Animate page={<ForgotPassword />} />} />
            
            <Route path="/buyer/homepage" element={<BuyerProtectedRoute><Animate page={<Homepage />} /></BuyerProtectedRoute>} />
            <Route path="/buyer/inbox" element={<BuyerProtectedRoute><Animate page={<BuyerLayout content={<BuyerInbox />}/>} /></BuyerProtectedRoute>} />
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
            <Route path="/seller/signin" element={<Animate page={<SellerSignin />} />} />
            <Route path="/seller/signup" element={<Animate page={<SellerSignup />} />} />
            <Route path="/seller/forgot-password" element={<Animate page={<SellerForgotPassword />} />} />
            
            <Route path="/seller/dashboard" element={<SellerProtectedRoute><Animate page={<Layout Body={<SellerDashboard />}/>} /></SellerProtectedRoute>} />
            <Route path="/seller/security" element={<SellerProtectedRoute><Animate page={<Layout Body={<Security />}/>} /></SellerProtectedRoute>} />
            <Route path="/seller/sales" element={<SellerProtectedRoute><Animate page={<Layout Body={<Sales />}/>} /></SellerProtectedRoute>} />
            <Route path="/seller/upgrade" element={<SellerProtectedRoute><Animate page={<Layout Body={<Upgrade />}/>} /></SellerProtectedRoute>} />
            <Route path="/seller/add-products" element={<SellerProtectedRoute><Animate page={<Layout Body={<AddProduct/>}/>} /></SellerProtectedRoute>} />
            <Route path="/seller/Inbox" element={<SellerProtectedRoute><Animate page={<Layout Body={<Inbox/>}/>} /></SellerProtectedRoute>} />
            <Route path="/seller/inventory" element={<SellerProtectedRoute><Animate page={<Layout Body={<Inventory/>}/>} /></SellerProtectedRoute>} />
            <Route path="/seller/trade" element={<SellerProtectedRoute><Animate page={<Layout Body={<Trade/>}/>} /></SellerProtectedRoute>} />
            <Route path="/seller/Product-Feedback" element={<SellerProtectedRoute><Animate page={<Layout Body={<Feedback/>}/>} /></SellerProtectedRoute>} />
            <Route path="/seller/incoterms" element={<SellerProtectedRoute><Animate page={<Layout Body={<Incoterms/>}/>} /></SellerProtectedRoute>} />
            <Route path="/seller/add-product-terms" element={<SellerProtectedRoute><Animate page={<Layout Body={<SellerAddProductTerms />}/>} /></SellerProtectedRoute>} />
            
            {/* Seller settings with default layout */}
          
            {/* Seller settings with different layout */}
            <Route path="/seller/settings" element={<SellerProtectedRoute><Animate page={<SellerSettings />} /></SellerProtectedRoute>}/>

  

          {/* 404 page  */}
          <Route path="*" element={<Notfoundpage />} />

          {/* Internal Error  */}
          <Route path="/internal-error" element={<div className="shadow-2xl max-w-fit whitespace-nowrap flex p-5 my-72 mx-auto max-h-fit text-3xl rounded-lg text-center">Error code 500 <br/> Internal Server Error</div>} />
        </Routes>
       
      
    </AnimatePresence>
  );
};

export default AppRoutes;
