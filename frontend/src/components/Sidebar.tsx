import UserProfile from "./Userprofile";
import SidebarItem from "./SidebarItem";
import SidebarBottom from "./SidebarButtom";
import { Store, Inbox, ShoppingCart, Repeat, Heart } from "lucide-react";
import BreyusLogo from "../seller/vectors/full-logo.svg"
import { useState } from "react";
import React from "react";
import { usernameService } from "../services/users.service";



const Sidebar = () => {

  const [username, setUsername] = useState<string>("");
  
      React.useEffect(() => {
          const fetchUsername = async () => {
              try {
                  const user = await usernameService();
                  if (user && typeof user.name === "string") {
                      user.name = user.name.split("@")[0];
                  }
                  setUsername(user?.name || "User");
              } catch (error) {
                  setUsername("User");
              }
          };
          fetchUsername();
      }, []);
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
        <UserProfile name={username} />

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