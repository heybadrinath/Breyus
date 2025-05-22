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
import {AddProduct, Inventory, Incoterms} from "../seller/products";
import ForgotPassword from "../buyer/forgot-password";
import BuyerLayout from "../buyer/components/layout";





import SellerForgotPassword from "../seller/forgot-password";
import { Layout } from "../seller/components";
import Inbox from "../seller/inbox"; 
import {Trade,Feedback} from "../seller/trade";

import BuyerInbox from "../buyer/pages/Inbox";
import Homepage from "../buyer/pages/Homepage";
import Wishlist from "../buyer/pages/Wishlist";
import ProductCard from "../buyer/components/ProductCard";
import CartPage from "../buyer/pages/Cartpage";
import BuyerTrade from "../buyer/pages/trade";
import ProductPage from "../buyer/pages/product";
import OrderRequestQuantity from "../buyer/pages/order_request_quantity";
import BuyerInformation from "../buyer/pages/buyer_information";
import BuyerAddress from "../buyer/pages/buyer_address";

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
          <Route path="/buyer/homepage" element={<Animate page={<Homepage />} />} />
          <Route path="/buyer/inbox" element={<Animate page={<BuyerInbox />} />} />
          <Route path="/buyer/wishlist" element={<Animate page={<Wishlist />} />} />
          <Route path="/buyer/cartpage" element={<Animate page={<CartPage />} />} />
          <Route path="/buyer/buyer-address" element={<Animate page={<BuyerAddress />} />} />



          <Route path="/buyer/trade" element={<Animate page={<BuyerLayout content={<BuyerTrade />} />} />} />

          <Route path="/buyer/product-page" element={<Animate page={<BuyerLayout content={<ProductPage />} />} />} />
          <Route path="/buyer/product-request-quantity" element={<Animate page={<BuyerLayout content={<OrderRequestQuantity />} />} />} />
          <Route path="/buyer/buyer-information" element={<Animate page={<BuyerLayout content={<BuyerInformation />} />} />} />
          


            
          
          
          {/* Seller Routes */}
          <Route path="/seller/signin" element={<Animate page={<SellerSignin />} />} />
          <Route path="/seller/signup" element={<Animate page={<SellerSignup />} />} />
          <Route path="/seller/forgot-password" element={<Animate page={<SellerForgotPassword />} />} />
          <Route path="/seller/dashboard" element={<Animate page={<Layout Body={<SellerDashboard />}/>} />} />
          <Route path="/seller/security" element={<Animate page={<Layout Body={<Security />}/>} />} />
          <Route path="/seller/sales" element={<Animate page={<Layout Body={<Sales />}/>} />} />
          <Route path="/seller/upgrade" element={<Animate page={<Layout Body={<Upgrade />}/>} />} />
          <Route path="/seller/add-products" element={<Animate page={<Layout Body={<AddProduct/>}/>} />} />
          <Route path="/seller/Inbox" element={<Animate page={<Layout Body={<Inbox/>}/>} />} />
          <Route path="/seller/inventory" element={<Animate page={<Layout Body={<Inventory/>}/>} />} />
          <Route path="/seller/trade" element={<Animate page={<Layout Body={<Trade/>}/>} />} />
          <Route path="/seller/Product-Feedback" element={<Animate page={<Layout Body={<Feedback/>}/>} />} />
          <Route path="/seller/incoterms" element={<Animate page={<Layout Body={<Incoterms/>}/>} />} />
      

  
         
  
       

          {/* Seller settings with different layout */}
          <Route path="/seller/settings" element={<Animate page={<SellerSettings />} />}/>

  
  
          {/* 404 page  */}
          <Route path="*" element={<Notfoundpage />} />
        </Routes>
       
      
    </AnimatePresence>
  );
};

export default AppRoutes;
