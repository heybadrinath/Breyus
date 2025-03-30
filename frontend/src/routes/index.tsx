import React from "react";
import { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Signin from "../buyer/signin";  // Buyer Signin
import Signup from "../buyer/signup";  // Buyer Signup
import SellerSignin from "../seller/signin";  // Seller Signin
import SellerSignup from "../seller/signup";  // Seller Signup
import Hero from "../main/hero";  // Hero Page
import SellerSettings from "../seller/settings";
import SellerDashboard from "../seller/dashboard";
import Security from "../seller/security";
import { motion, AnimatePresence } from "framer-motion";
import { Leftnavdash, Header } from "../seller/components";
import Sales from "../seller/sales";

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


        {/* Buyer Routes */}
        <Route path="/buyer/signin" element={<Animate page={<Signin />} />} />
        <Route path="/buyer/signup" element={<Animate page={<Signup />} />} />

        {/* Seller Routes */}
        <Route path="/seller/signin" element={<Animate page={<SellerSignin />} />} />
        <Route path="/seller/signup" element={<Animate page={<SellerSignup />} />} />
        <Route path="/seller/dashboard" element={<Animate page={<SellerDashboard />} />} />
        <Route path="/seller/security" element={<Animate page={<Security />} />} />
        <Route path="/seller/settings" element={<Animate page={<SellerSettings />} />} />
        <Route path="/seller/sales" element={<Animate page={<Sales/>} />} />

        {/* 404 page  */}
        <Route path="*" element={<Notfoundpage />} />
      </Routes>

    </AnimatePresence>

  );
};

export default AppRoutes;
