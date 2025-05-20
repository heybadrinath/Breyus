import Sidebar from "../components/Sidebar";
import Navbar from "../components/navbar";
interface BuyerLayoutProps {
    content?: React.ReactNode;
}

const BuyerLayout: React.FC<BuyerLayoutProps> = ({ content }) => {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Fixed Sidebar */}
            <div className="fixed left-0 top-0 h-screen">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 ml-64 overflow-y-auto">
                {/* Fixed Navbar */}
                <div className="fixed top-0 right-0 left-64 z-10 p-6">
                    <Navbar />
                </div>

                {/* Scrollable Content */}
                <div className="pt-24 px-6">{content}</div>
            </div>
        </div>
    );
};
export default BuyerLayout;