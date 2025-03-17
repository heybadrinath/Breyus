import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signin from "../buyer/signin";  // Buyer Signin
import Signup from "../buyer/signup";  // Buyer Signup
import SellerSignin from "../seller/signin";  // Seller Signin
import SellerSignup from "../seller/signup";  // Seller Signup
import Hero from "../main/hero";  // Hero Page

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Hero Page */}
        <Route path="/" element={<Hero />} />

        {/* Buyer Routes */}
        <Route path="/buyer/signin" element={<Signin />} />
        <Route path="/buyer/signup" element={<Signup />} />

        {/* Seller Routes */}
        <Route path="/seller/signin" element={<SellerSignin />} />
        <Route path="/seller/signup" element={<SellerSignup />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
