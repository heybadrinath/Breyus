import React from 'react';
import { Tabs, Table, TableRow } from '../../seller/trade';
import TradeHistorySearch from '../components/TradeHistorySearch';
import ProductCard from '../components/ProductCard';


const HeadingDescription: React.FC<{ heading: string; description: string }> = ({ heading, description }) => {
  return (
    <div className='flex gap-2 flex-col my-2'>
      <h1 className='text-3xl font-extrabold'>{heading}</h1>
      <p className='text-gray-400'>{description}</p>
    </div>
  );

}

const BlueButton: React.FC<{ text: string }> = ({ text }) => {
  return (
    <button className='border-[#0076D3] bg-transparent border-[1.5px] mx-3 text-black rounded-lg px-3 py-1 hover:bg-gray-50 transition-all duration-300 ease-in-out hover:scale-[1.03]'>
      {text}
    </button>
  );
}

const RedButton: React.FC<{ text: string }> = ({ text }) => {
  return (
    <button className='m-auto flex bg-red-400 px-3 py-1 rounded-md cursor-pointer hover:bg-red-500 transition-all duration-300 ease-in-out hover:scale-[1.03]'>{text}</button>
  );
}

const GreenButton: React.FC<{ text: string }> = ({ text }) => {
  return (
    <button className='m-auto flex bg-green-400  cursor-pointer px-3 py-1 rounded-md hover:bg-green-500 transition-all duration-300 ease-in-out hover:scale-[1.03]'>{text}</button>
  );
};


const EntriesPerPage: React.FC<{ options: number[]; selected: number; onChange: (value: number) => void }> = ({ options, selected, onChange }) => {
  return (
    <div className="flex items-center gap-2 my-6">
      <select
        value={selected}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border-gray-300 border-[1px] rounded-md px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-gray-500 text-sm">entries per page</span>
    </div>
  );
};



const PurchaseRequestStatus: React.FC = () => {
  return (
    <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
        <div className='flex w-full justify-between'>
            <HeadingDescription heading='Purchase Request' description='Check whether the things are their or not' />
            <div className='flex gap-2 mt-auto mr-2 my-auto'>
                <BlueButton text='Filter' />
                <BlueButton text='Export CSV' />
            </div>
        </div>

        <EntriesPerPage
            options={[5, 10, 20, 50]}
            selected={5}
            onChange={(value) => console.log("Selected entries per page:", value)}
        />

        <Table
            headers={[
                'ID',
                'Trade Terms',
                'Seller',
                'Product',
                'Request',
                'Status',
                'Purchase order'
            ]}
            rows={[
                <TableRow
                    cells={[
                        '123344823',
                        <a href="#" className="text-blue-600 font-medium underline">Terms Doc</a>,
                        '-----------',
                        '-----------',
                        <div className="flex gap-2 justify-center items-center">
                            <span className="rounded-full border-2 border-green-400 text-green-400 flex items-center justify-center w-6 h-6">&#10003;</span>
                            <span className="rounded-full border-2 border-red-400 text-red-400 flex items-center justify-center w-6 h-6">&#10005;</span>
                        </div>,
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                            <span className="text-gray-700">Pending</span>
                        </div>,
                        <span className="text-gray-400">NA</span>
                    ]}
                />,
                <TableRow
                    cells={[
                        '123344823',
                        <a href="#" className="text-blue-600 font-medium underline">Terms Doc</a>,
                        '-----------',
                        '-----------',
                        <div className="flex gap-2 justify-center items-center">
                            <span className="rounded-full border-2 border-green-400 text-green-400 flex items-center justify-center w-6 h-6">&#10003;</span>
                            <span className="rounded-full border-2 border-red-400 text-red-400 flex items-center justify-center w-6 h-6">&#10005;</span>
                        </div>,
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
                            <span className="text-gray-700">Accepted</span>
                        </div>,
                        <button className="border border-black rounded px-4 py-1 hover:bg-gray-100 transition">Proceed</button>
                    ]}
                />,
                <TableRow
                    cells={[
                        '123344823',
                        <a href="#" className="text-blue-600 font-medium underline">Terms Doc</a>,
                        '-----------',
                        '-----------',
                        <span className="text-blue-600 font-medium underline cursor-pointer">Send Again</span>,
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                            <span className="text-gray-700">Declined</span>
                        </div>,
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-gray-700">Chat with seller</span>
                        </div>
                    ]}
                />
            ]}
        />
    </div>

  );
}

const PurchaseOrderStatus: React.FC = () => {
  return (
    <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>
        <div className='flex w-full justify-between'>
            <HeadingDescription heading='Purchase Request' description='Check whether the things are their or not' />
            <div className='flex gap-2 mt-auto mr-2 my-auto'>
                <BlueButton text='Filter' />
                <BlueButton text='Export CSV' />
            </div>
        </div>

        <EntriesPerPage
            options={[5, 10, 20, 50]}
            selected={5}
            onChange={(value) => console.log("Selected entries per page:", value)}
        />

        <Table
            headers={[
                'ID',
                'Trade Terms',
                'Seller',
                'Product',
                'Request',
                'Status',
                'Purchase order'
            ]}
            rows={[
                <TableRow
                    cells={[
                        '123344823',
                        <a href="#" className="text-blue-600 font-medium underline">Terms Doc</a>,
                        '-----------',
                        '-----------',
                        <div className="flex gap-2 justify-center items-center">
                            <span className="rounded-full border-2 border-green-400 text-green-400 flex items-center justify-center w-6 h-6">&#10003;</span>
                            <span className="rounded-full border-2 border-red-400 text-red-400 flex items-center justify-center w-6 h-6">&#10005;</span>
                        </div>,
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                            <span className="text-gray-700">Pending</span>
                        </div>,
                        <span className="text-gray-400">NA</span>
                    ]}
                />,
                <TableRow
                    cells={[
                        '123344823',
                        <a href="#" className="text-blue-600 font-medium underline">Terms Doc</a>,
                        '-----------',
                        '-----------',
                        <div className="flex gap-2 justify-center items-center">
                            <span className="rounded-full border-2 border-green-400 text-green-400 flex items-center justify-center w-6 h-6">&#10003;</span>
                            <span className="rounded-full border-2 border-red-400 text-red-400 flex items-center justify-center w-6 h-6">&#10005;</span>
                        </div>,
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
                            <span className="text-gray-700">Accepted</span>
                        </div>,
                        <button className="border border-black rounded px-4 py-1 hover:bg-gray-100 transition">Proceed to pay</button>
                    ]}
                />,
                <TableRow
                    cells={[
                        '123344823',
                        <a href="#" className="text-blue-600 font-medium underline">Terms Doc</a>,
                        '-----------',
                        '-----------',
                        <span className="text-blue-600 font-medium underline cursor-pointer">Send Again</span>,
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                            <span className="text-gray-700">Declined</span>
                        </div>,
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-gray-700">Chat with seller</span>
                        </div>
                    ]}
                />
            ]}
        />
    </div>

  );
}

const Order = () => {
    return(
        <div className='scale-95 my-10'>
            <div id="top">
                <div className="flex items-center justify-between bg-black text-white rounded-t-md px-6 py-5">
                    <div className="flex gap-16">
                        <div>
                            <div className="text-sm font-semibold">ORDER PLACED</div>
                            <div className="text-base mt-1">10 January 2025</div>
                        </div>
                        <div>
                            <div className="text-sm font-semibold">Total</div>
                            <div className="text-base mt-1">xxxxxx</div>
                        </div>
                        <div>
                            <div className="text-sm font-semibold">Ship to</div>
                            <a href="#" className="text-blue-400 text-base mt-1 block hover:underline">Max Sharma</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col items-end">
                            <span className="font-bold text-lg">Order # 12445382492-232323</span>
                            <div className="flex items-center gap-5 mt-1">
                                <a href="#" className="text-blue-400 text-base hover:underline">View order details</a>
                                <span className="h-5 border-r border-gray-400"></span>
                                <a href="#" className="text-blue-400 text-base hover:underline">Invoice</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="bottom">
                {/* Top: Delivery Info */}
                <div className="px-8 pt-8 pb-4">
                    <div className="text-2xl font-bold mb-1">Delivered 13 January</div>
                    <div className="text-gray-500">Package was handed to&nbsp; xxxxx</div>
                </div>
                {/* Bottom: Product, Actions, Buttons */}
                <div className="flex gap-8 px-8 pb-8 items-stretch">
                    {/* Left: Product Image */}
                    <div className="flex  w-[450px] h-[auto] bg-gray-200 rounded-md" />
                    {/* Middle: Product Info & Actions */}
                    <div className="flex w-fit m-auto flex-col">
                        <div className="mb-6">
                            <div className="text-black text-lg" style={{ letterSpacing: 2 }}>
                                ------------------------------------------
                            </div>
                            <div className="text-black text-lg" style={{ letterSpacing: 2 }}>
                                ----------------------
                            </div>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <button className="border border-gray-400 rounded-md px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition">
                                <span role="img" aria-label="repeat">&#8635;</span>
                                Buy it again
                            </button>
                            <button className="border border-gray-400 rounded-md px-4 py-2 hover:bg-gray-50 transition">
                                View your item
                            </button>
                        </div>
                    </div>
                    {/* Right: Action Buttons */}
                    <div className="flex flex-col gap-4 w-64">
                        <button className="border border-gray-400 rounded-md px-6 py-2 text-base hover:bg-gray-50 transition">Purchase Request status</button>
                        <button className="border border-gray-400 rounded-md px-6 py-2 text-base hover:bg-gray-50 transition">Ask Product Doubt</button>
                        <button className="border border-gray-400 rounded-md px-6 py-2 text-base hover:bg-gray-50 transition">Leave Seller Feedback</button>
                        <button className="border border-gray-400 rounded-md px-6 py-2 text-base hover:bg-gray-50 transition">Leave Delivery Feedback</button>
                        <button className="border border-gray-400 rounded-md px-6 py-2 text-base hover:bg-gray-50 transition">Track Package</button>
                    </div>
                </div>
                    
                </div>
            
        </div>
    );
};


const OrderSection = () => {
    return(
        <div>
            <Order />
            <Order />
        </div>
    );
};

const BuyAgain = () => {
    return(
        <div className="grid grid-cols-4 gap-6">
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
        </div>
    );
}


const Trade: React.FC = () => {
    const tabLabels = ['Purchase Request Status', 'Purchase Order Status', 'All Trades', 'Buy Again'];
    const [activeTab, setActiveTab] = React.useState(tabLabels[0]);
    
    const handleTabChange = (tab: string): void => {
        setActiveTab(tab);
    };

    return (
        <div className="w-[98%] mx-auto text-lg p-8 bg-white rounded-xl shadow-lg">
            <TradeHistorySearch className="w-fit mx-auto my-8" />
            <Tabs
            tabs={tabLabels}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            className='scale-110 !w-[88%]'
            />

            {/* Render tab content based on activeTab */}
            <div className="mt-4">
            {activeTab === 'Purchase Request Status' && <PurchaseRequestStatus />}
            {activeTab === 'Purchase Order Status' && <PurchaseOrderStatus />}
            {activeTab === 'All Trades' && <OrderSection />}
            {activeTab === 'Buy Again' && <BuyAgain />}
            </div>
        </div>
            
     
    );
}

export default Trade;