import React, { ReactNode } from "react";
import { SellerProtectedRoute, BuyerProtectedRoute } from "./ProtectedRoute"; // Protected Route for authenticated users
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Layout } from "../components/layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BlogAuthProvider } from "../blog/context/BlogAuthContext";

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
import SellerNegotiation from "../seller/pages/negotiation";
import SellerSettings from "../seller/pages/settings";
import SellerMarketplace from "../seller/pages/Marketplace";
import BuyerProfile from "../seller/pages/buyer-profile";
import SellerWishlist from "../seller/pages/Wishlist";






// Buyer links
import Homepage from "../buyer/pages/Homepage";
import ProductPage from "../buyer/pages/product";
import { PurchaseRequest } from "../buyer/pages/purchase-request"
import BuyerInbox from "../buyer/pages/Inbox";
import { Trade as BuyerTrade } from "../buyer/pages/trade";
import Wishlist from "../buyer/pages/Wishlist";
import ThankYou from "../buyer/pages/purchase-request-success";
import BuyerNegotiation from "../buyer/pages/negotiation";
import TradeComplete from "../components/TradeComplete";
import BuyerSettings from "../buyer/pages/settings";
import BuyerMarketplace from "../buyer/pages/Marketplace";
import SellerProfile from "../buyer/pages/seller-profile";



// Buyer AI Imports
import BuyerAi from "../buyer/pages/ai";
import BuyerAiNiche from "../buyer/pages/ai-niche";
import BuyerAiSelect from "../buyer/pages/ai-select";
import BuyerAiResult from "../buyer/pages/ai-result";

// Seller AI Imports
import SellerSearchOption from "../seller/pages/SellerSearchOption";
import SellerSearchInput from "../seller/pages/SellerSearchInput";
import SellerAiSelect from "../seller/pages/ai-select";
import SellerSearchResult from "../seller/pages/SellerSearchResult";
import SellerAiLanding from "../seller/pages/ai-landing";
import SellerAiInventory from "../seller/pages/ai-inventory";
import SellerAiResult from "../seller/pages/ai-result";
import Notifications from "../pages/Notifications";

// Blog Portal Imports
import {
  BlogHomePage,
  BlogLoginPage,
  BlogSignupPage,
  BlogPostPage,
  BlogCategoryPage,
  BlogSearchPage,
  WriterProfilePage,
  BlogForgotPasswordPage,
  BlogSettingsPage,
  WritersPage,
  TrendingPage,
  WriterDashboard,
  WriterEditor,
  WriterInvitePage,
} from "../blog/pages";

// Create a QueryClient for blog portal
const blogQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Wrapper component for blog routes that provides necessary context
const BlogPortalWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={blogQueryClient}>
      <BlogAuthProvider>
        {children}
      </BlogAuthProvider>
    </QueryClientProvider>
  );
};

const pageVariants: Variants = {
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
        <Route path="/buyer/purchase-request-success" element={<BuyerProtectedRoute><Animate page={<ThankYou />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/inbox" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<BuyerInbox />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/wishlist" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<Wishlist />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/trade" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<BuyerTrade />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/negotiation/:tradeId" element={<BuyerProtectedRoute><Animate page={<BuyerNegotiation />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/trade-complete" element={<BuyerProtectedRoute><Animate page={<TradeComplete isSeller={false} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/settings" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<BuyerSettings />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/notifications" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<Notifications />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/marketplace" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<BuyerMarketplace />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/seller-profile/:companyId" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<SellerProfile />} />} /></BuyerProtectedRoute>} />






        {/* Seller Routes */}
        <Route path="/seller/dashboard" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerDashboard />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/sales" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Sales />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/upgrade" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Upgrade />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/add-products" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<AddProduct />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/inventory" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Inventory />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/Product-Feedback" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Feedback />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/Inbox" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Inbox />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/trade" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Trade />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/negotiation/:tradeId" element={<SellerProtectedRoute><Animate page={<SellerNegotiation />} /></SellerProtectedRoute>} />
        <Route path="/seller/trade-complete" element={<SellerProtectedRoute><Animate page={<TradeComplete isSeller={true} />} /></SellerProtectedRoute>} />
        <Route path="/seller/settings" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerSettings />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/notifications" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<Notifications />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/marketplace" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerMarketplace />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/buyer-profile/:companyId" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<BuyerProfile />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/wishlist" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerWishlist />} />} /></SellerProtectedRoute>} />




        {/*Buyer AI Routes */}
        <Route path="/buyer/ai" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<BuyerAi />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/ai-niche" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<BuyerAiNiche />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/ai-select" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<BuyerAiSelect />} />} /></BuyerProtectedRoute>} />
        <Route path="/buyer/ai-result" element={<BuyerProtectedRoute><Animate page={<Layout Buyer={true} Body={<BuyerAiResult />} />} /></BuyerProtectedRoute>} />
        {/* <Route path="/buyer/ai-country" element={<BuyerProtectedRoute><Animate page={<BuyerAiCountry />} /></BuyerProtectedRoute>} /> */}
        {/* <Route path="/buyer/ai-port" element={<BuyerProtectedRoute><Animate page={<BuyerAiPort />} /></BuyerProtectedRoute>} /> */}
        {/* <Route path="/buyer/ai-product" element={<BuyerProtectedRoute><Animate page={<BuyerAiproduct />} /></BuyerProtectedRoute>} /> */}

        {/*Seller Ai Routes */}
        <Route path="/seller/ai" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerAiLanding />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/ai-inventory" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerAiInventory />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/ai-result" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerAiResult />} />} /></SellerProtectedRoute>} />
        {/* Legacy seller AI routes - kept for backward compatibility */}
        <Route path="/seller/search-option" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerSearchOption />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/search-input" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerSearchInput />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/ai-select" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerAiSelect />} />} /></SellerProtectedRoute>} />
        <Route path="/seller/search-result" element={<SellerProtectedRoute><Animate page={<Layout Seller={true} Body={<SellerSearchResult />} />} /></SellerProtectedRoute>} />


        {/* Blog Portal Routes - All wrapped with BlogPortalWrapper for auth context */}
        <Route path="/blog" element={<BlogPortalWrapper><Animate page={<BlogHomePage />} /></BlogPortalWrapper>} />
        <Route path="/blog/login" element={<BlogPortalWrapper><Animate page={<BlogLoginPage />} /></BlogPortalWrapper>} />
        <Route path="/blog/signup" element={<BlogPortalWrapper><Animate page={<BlogSignupPage />} /></BlogPortalWrapper>} />
        <Route path="/blog/post/:slug" element={<BlogPortalWrapper><Animate page={<BlogPostPage />} /></BlogPortalWrapper>} />
        <Route path="/blog/category/:category" element={<BlogPortalWrapper><Animate page={<BlogCategoryPage />} /></BlogPortalWrapper>} />
        <Route path="/blog/search" element={<BlogPortalWrapper><Animate page={<BlogSearchPage />} /></BlogPortalWrapper>} />
        <Route path="/blog/writers" element={<BlogPortalWrapper><Animate page={<WritersPage />} /></BlogPortalWrapper>} />
        <Route path="/blog/trending" element={<BlogPortalWrapper><Animate page={<TrendingPage />} /></BlogPortalWrapper>} />
        <Route path="/blog/author/:id" element={<BlogPortalWrapper><Animate page={<WriterProfilePage />} /></BlogPortalWrapper>} />
        <Route path="/blog/forgot-password" element={<BlogPortalWrapper><Animate page={<BlogForgotPasswordPage />} /></BlogPortalWrapper>} />
        <Route path="/blog/settings" element={<BlogPortalWrapper><Animate page={<BlogSettingsPage />} /></BlogPortalWrapper>} />
        <Route path="/blog/invite/:token" element={<BlogPortalWrapper><Animate page={<WriterInvitePage />} /></BlogPortalWrapper>} />

        {/* Blog Portal Writer Routes (Protected - requires blog auth + writer status) */}
        <Route path="/blog/writer" element={<BlogPortalWrapper><Animate page={<WriterDashboard />} /></BlogPortalWrapper>} />
        <Route path="/blog/writer/new" element={<BlogPortalWrapper><Animate page={<WriterEditor />} /></BlogPortalWrapper>} />
        <Route path="/blog/writer/edit/:postId" element={<BlogPortalWrapper><Animate page={<WriterEditor />} /></BlogPortalWrapper>} />


        {/* Essential Error routes */}
        <Route path="*" element={<Animate page={<Notfoundpage />} />} />
        <Route path="/internal-error" element={<div className="shadow-2xl max-w-fit whitespace-nowrap flex p-5 my-72 mx-auto max-h-fit text-3xl rounded-lg text-center">Error code 500 <br /> Internal Server Error</div>} />

      </Routes>


    </AnimatePresence>
  );
};

export default AppRoutes;
