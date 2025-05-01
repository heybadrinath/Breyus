import Banner from "./Banner";
import Navbar from "./navbar";
import ProductCard from "./ProductCard";
import Sidebar from "./Sidebar";

interface LayoutProps {
    children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Fixed Sidebar */}
            <div className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-lg z-10">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 ml-64 overflow-y-auto">
                {/* Fixed Navbar */}
                <div className="fixed top-0 right-0 left-64 z-10 p-6">
                    <Navbar />
                </div>
                <div className="my-24"></div>
                {children}


                
            </div>
        </div>
    );
};

export default Layout;
  