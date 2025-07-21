import Sidebar from "../components/Sidebar";
interface LayoutProps {
    Body?: React.ReactNode;
    Buyer?: Boolean;
    Seller?: Boolean;
}

const Layout: React.FC<LayoutProps> = ({ Body, Buyer, Seller }) => {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Fixed Sidebar */}
            <div className="fixed left-0 top-0 h-screen">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 ml-64 overflow-y-auto">
                {/* Scrollable Content */}
                <div className="px-6">{Body}</div>
            </div>
        </div>
    );
};
export { Layout };