import { Store, Inbox, ShoppingCart, Repeat, Heart, HelpCircle, Settings, ChevronDown, LayoutDashboard, Tag, CircleUser } from "lucide-react";
import BreyusLogo from "../assets/Logos/full-logo.svg"
import { useState } from "react";
import React from "react";
import { useNavigate, Link } from 'react-router-dom';
import { usernameService } from "../services/users.service";


interface UserProfileProps {
  name: string;
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ name, className = '' }) => {
  return (
    <div style={{
      borderTop: '1.6px solid transparent',
      borderBottom: '1.6px solid transparent',
      borderImage: 'linear-gradient(to left, #ECECEC, #0000007e, #ECECEC) 1',
      borderLeft: 'none',
      borderRight: 'none'
    }} className={`flex items-center w-fit mx-auto border px-6 py-4 ${className}`}>
      <CircleUser strokeWidth={1.8} size={40}/>
      <div className="ml-4 text-base font-semibold text-gray-800 capitalize">{name}</div>
    </div>
  );
};

const SidebarBottom: React.FC = () => {
  return (
    <div className="px-6 mb-8 space-y-6 mx-auto">
      <div className="flex items-center space-x-4 cursor-pointer hover:text-gray-700 transition-colors">
        <HelpCircle size={22} />
        <span className="text-md font-medium">Help & Support</span>
      </div>

      <div className="flex items-center space-x-4 cursor-pointer hover:text-gray-700 transition-colors">
        <Settings size={22} />
        <span className="text-md font-medium">Settings</span>
      </div>
    </div>
  );
};



interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path?: string;
  className?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, path, className = '' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <div
      className={`flex w-full cursor-pointer pl-2 pr-10 py-2 rounded-xl hover:bg-[#00000021] transition-colors ${className}`}
      onClick={handleClick}
    >
      <div className='mr-4'>{icon}</div>
      <span className="text-md font-medium">{label}</span>
    </div>
  );
};


// Define types for the props
interface DropdownLink {
  to: string;
  label: string;
}

interface CollapsibleDropdownProps {
  label?: string | null;
  icon?: React.ReactNode;
  downArrow?: boolean;
  dropdownLinks: DropdownLink[];
}

const SideBarItemDropDownItem: React.FC<CollapsibleDropdownProps> = ({
  label = null,
  icon = null,
  downArrow = true,
  dropdownLinks = []
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleDropdown = () => {
    setIsOpen(prevState => !prevState);
  };

  return (
    <div>
      <div
        onClick={toggleDropdown}
        className={`flex items-center cursor-pointer p-2 rounded-lg transition-all duration-300 ease-in-out 
                    hover:!bg-[#00000025] ${isOpen ? "bg-[#00000025]" : "bg-none"}`}
      >
        <div className='mr-4'>{icon}</div>
        <span className="text-md font-medium">{label}</span>
        {downArrow && (
          <ChevronDown
            size={16}
            className={`transition-transform ml-auto duration-500 ${isOpen ? "rotate-180" : "rotate-0"}`}
          />
        )}
      </div>

      {/* Dropdown content */}
      <div
        className={`flex flex-col overflow-hidden transition-all duration-500 ease-out ${isOpen ? "max-h-56 opacity-100" : "max-h-0 opacity-0"}`}
      >
        {dropdownLinks.map((link, index) => (
          <Link
            key={index}
            className=" pt-4 px-3 font-medium"
            to={link.to}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
};


interface SideBarProp {
  Buyer?: boolean;
  Seller?: boolean
}


const Sidebar: React.FC<SideBarProp> = ({ Buyer = false, Seller = false }) => {

  const [username, setUsername] = useState<string>("");
  const navigate = useNavigate();

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
        <div className="px-6 py-8 mx-auto w-fit cursor-pointer">
          <img
            src={BreyusLogo}
            alt="BREYUS Logo"
            onClick={ () => {navigate((Buyer?"/buyer/homepage": "/seller/dashboard"))}}
            className="h-10"
          />
        </div>

        {/* User Profile */}
        <UserProfile name={username} />

        {/* Navigation Links */}
        {Buyer && <nav className="mt-8 space-y-4 w-fit px-6 mx-auto">
          <SidebarItem icon={<Store size={22} />} label="Market" path="/buyer/homepage" />
          <SidebarItem icon={<Inbox size={22} />} label="Inbox" path="/buyer/inbox" />
          <SidebarItem icon={<ShoppingCart size={22} />} label="Cart" path="/buyer/cartpage" />
          <SidebarItem icon={<Repeat size={22} />} label="Trade" path="/buyer/trade" />
          <SidebarItem icon={<Heart size={22} />} label="Wishlist" path="/buyer/wishlist" />
        </nav>}

        {Seller && <nav className="mt-8 space-y-4 w-fit px-6 mx-auto">
          <SideBarItemDropDownItem icon={<LayoutDashboard size={22} />} label={"Dashboard"} dropdownLinks={[
            { to: "/seller/dashboard", label: "Analytics", },
            { to: "/seller/sales", label: "Sales", },
            { to: "/seller/upgrade", label: "Product Analysis", },
            { to: "/seller/upgrade", label: "Advanced Analysis", }
          ]} />
          <SideBarItemDropDownItem icon={<Tag size={22} />} label={"Products"} dropdownLinks={[
            { to: "/seller/add-products", label: "Add Product", },
            { to: "/seller/inventory", label: "Inventory", },
            { to: "/seller/Product-Feedback", label: "Feedback", },

          ]} />
          <SidebarItem icon={<Inbox size={22} />} label="Inbox" path="/seller/inbox" />
          <SidebarItem icon={<Repeat size={22} />} label="Trade" path="/seller/trade" />

        </nav>}
      </div>

      {/* Bottom Section */}
      <SidebarBottom />
    </aside>
  );
};

export default Sidebar;