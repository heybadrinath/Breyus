import { Store, Inbox, ShoppingCart, Repeat, Heart, HelpCircle, Settings, ChevronDown, LayoutDashboard, Tag, LogOut, Sparkles, Globe } from "lucide-react";
import BreyusLogo from "../assets/Logos/full-logo.svg"
import { useState } from "react";
import React from "react";
import { useNavigate, Link } from 'react-router-dom';
import { usernameService } from "../services/users.service";
import { logout } from "../services/auth.service";
import { useNotifications } from "../contexts/NotificationContext";
import { getCompanyProfile } from "../services/company.service";
import CompanyAvatar from "./ui/CompanyAvatar";


interface UserProfileProps {
  name: string;
  profilePicture?: string | null;
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ name, profilePicture, className = '' }) => {
  return (
    <div style={{
      borderTop: '1px solid transparent',
      borderBottom: '1px solid transparent',
      borderImage: 'linear-gradient(to left, #f0f0f0, #d0d0d0, #f0f0f0) 1',
      borderLeft: 'none',
      borderRight: 'none'
    }} className={`flex items-center w-full px-6 py-5 ${className}`}>
      <CompanyAvatar
        companyName={name}
        profilePicture={profilePicture}
        size="md"
        clickable={false}
      />
      <div className="ml-3 text-sm font-semibold text-gray-800 truncate max-w-[140px]">{name}</div>
    </div>
  );
};

interface SidebarBottomProps {
  settingsPath?: string;
}

const SidebarBottom: React.FC<SidebarBottomProps> = ({ settingsPath = '/seller/settings' }) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="px-4 pb-6 pt-4 space-y-1 border-t border-gray-100">
      <div className="flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
        <HelpCircle size={20} />
        <span className="text-sm font-medium">Help & Support</span>
      </div>

      <div
        className="flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        onClick={() => navigate(settingsPath)}
      >
        <Settings size={20} />
        <span className="text-sm font-medium">Settings</span>
      </div>

      <div
        className="flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        onClick={handleLogout}
      >
        <LogOut size={20} />
        <span className="text-sm font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
      </div>
    </div>
  );
};



interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path?: string;
  className?: string;
  showDot?: boolean;
  badgeCount?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, path, className = '', showDot = false, badgeCount }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (path) {
      navigate(path);
    }
  };

  // Show badge with count if badgeCount > 0, otherwise show dot if showDot is true
  const showBadge = badgeCount !== undefined && badgeCount > 0;

  return (
    <div
      className={`flex items-center w-full cursor-pointer px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors ${className}`}
      onClick={handleClick}
    >
      <div className="relative mr-3 flex-shrink-0">
        {icon}
        {showBadge ? (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        ) : showDot && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </div>
      <span className="text-sm font-medium">{label}</span>
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
        className={`flex items-center cursor-pointer px-3 py-2.5 rounded-lg transition-all duration-300 ease-in-out
                    text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${isOpen ? "bg-gray-100" : ""}`}
      >
        <div className='mr-3 flex-shrink-0'>{icon}</div>
        <span className="text-sm font-medium">{label}</span>
        {downArrow && (
          <ChevronDown
            size={16}
            className={`transition-transform ml-auto duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
          />
        )}
      </div>

      {/* Dropdown content */}
      <div
        className={`flex flex-col overflow-hidden transition-all duration-300 ease-out ${isOpen ? "max-h-56 opacity-100 mt-1" : "max-h-0 opacity-0"}`}
      >
        {dropdownLinks.map((link, index) => (
          <Link
            key={index}
            className="py-2 px-3 pl-9 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
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
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const navigate = useNavigate();
  const { hasUnreadMessages, unreadCounts } = useNotifications();

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch username
        const user = await usernameService();
        if (user && typeof user.name === "string") {
          user.name = user.name.split("@")[0];
        }
        setUsername(user?.name || "User");

        // Fetch company profile for profile picture
        const companyProfile = await getCompanyProfile();
        if (companyProfile?.profilePicture) {
          setProfilePicture(companyProfile.profilePicture);
        }
      } catch (error) {
        setUsername("User");
      }
    };
    fetchUserData();
  }, []);
  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 flex-shrink-0">
        <img
          src={BreyusLogo}
          alt="BREYUS Logo"
          onClick={() => {navigate((Buyer ? "/buyer/homepage" : "/seller/dashboard"))}}
          className="h-8 cursor-pointer"
        />
      </div>

      {/* User Profile */}
      <UserProfile name={username} profilePicture={profilePicture} />

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {Buyer && <nav className="space-y-1">
          <SidebarItem icon={<Store size={20} />} label="Market" path="/buyer/homepage" />
          <SidebarItem icon={<Globe size={20} />} label="Marketplace" path="/buyer/marketplace" />
          <SidebarItem icon={<Inbox size={20} />} label="Inbox" path="/buyer/inbox" badgeCount={unreadCounts.messages} showDot={hasUnreadMessages} />
          <SidebarItem icon={<Repeat size={20} />} label="Trade" path="/buyer/trade" />
          <SidebarItem icon={<Heart size={20} />} label="Wishlist" path="/buyer/wishlist" />
          <SidebarItem icon={<Sparkles size={20} />} label="BreyusAI" path="/buyer/ai" />
        </nav>}

        {Seller && <nav className="space-y-1">
          <SideBarItemDropDownItem icon={<LayoutDashboard size={20} />} label={"Dashboard"} dropdownLinks={[
            { to: "/seller/dashboard", label: "Analytics", },
            { to: "/seller/sales", label: "Sales", },
            { to: "/seller/upgrade", label: "Product Analysis", },
            { to: "/seller/upgrade", label: "Advanced Analysis", }
          ]} />
          <SideBarItemDropDownItem icon={<Tag size={20} />} label={"Products"} dropdownLinks={[
            { to: "/seller/add-products", label: "Add Product", },
            { to: "/seller/inventory", label: "Inventory", },
            { to: "/seller/Product-Feedback", label: "Feedback", },
          ]} />
          <SidebarItem icon={<Globe size={20} />} label="Marketplace" path="/seller/marketplace" />
          <SidebarItem icon={<Inbox size={20} />} label="Inbox" path="/seller/inbox" badgeCount={unreadCounts.messages} showDot={hasUnreadMessages} />
          <SidebarItem icon={<Repeat size={20} />} label="Trade" path="/seller/trade" />
          <SidebarItem icon={<Heart size={20} />} label="Wishlist" path="/seller/wishlist" />
          <SidebarItem icon={<Sparkles size={20} />} label="BreyusAI" path="/seller/ai" />
        </nav>}
      </div>

      {/* Bottom Section */}
      <div className="flex-shrink-0">
        <SidebarBottom settingsPath={Buyer ? '/buyer/settings' : '/seller/settings'} />
      </div>
    </aside>
  );
};

export default Sidebar;
