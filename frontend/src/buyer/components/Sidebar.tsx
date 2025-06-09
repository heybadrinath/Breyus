import UserProfile from "./Userprofile";
import SidebarItem from "./SidebarItem";
import SidebarBottom from "./SidebarButtom";
import { Store, Inbox, ShoppingCart, Repeat, Heart } from "lucide-react";
import BreyusLogo from "../../seller/vectors/full-logo.svg"



const Sidebar = () => {
  return (
    <aside className="w-64 bg-white shadow-md h-screen flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* Logo */}
        <div className="px-6 py-8 mx-auto w-fit">
          <img
            src={BreyusLogo}
            alt="BREYUS Logo"
            className="h-10"
          />
        </div>

        {/* User Profile */}
        <UserProfile name="Max Sharma" />

        {/* Navigation Links */}
        <nav className="mt-8 space-y-4 w-fit px-6 mx-auto">
          <SidebarItem icon={<Store size={22} />} label="Market" path="/buyer/homepage" />
          <SidebarItem icon={<Inbox size={22} />} label="Inbox" path="/buyer/inbox" />
          <SidebarItem icon={<ShoppingCart size={22} />} label="Cart" path="/buyer/cartpage" />
          <SidebarItem icon={<Repeat size={22} />} label="Trade" path="/buyer/trade"/>
          <SidebarItem icon={<Heart size={22} />} label="Wishlist" path="/buyer/wishlist" />
        </nav>
      </div>

      {/* Bottom Section */}
      <SidebarBottom />
    </aside>
  );
};

export default Sidebar;