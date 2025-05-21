import React from 'react';
import { Search as SearchIcon, } from "lucide-react";
import { tab } from '@testing-library/user-event/dist/tab';


// Trade component for the seller module
const Search: React.FC = () => {
  return (
    <div className='flex w-[80%] h-fit bg-white mx-2 rounded-lg p-3 shadow-md border-gray-300 border-[1px] transition-transform duration-300 ease-in-out hover:scale-[1.01]'>
      <SearchIcon className='mx-2' />
      <input className='outline-none bg-transparent  h-full w-full' type="text" placeholder='search all your trades' />
    </div>
  );
}

const RoundedButton: React.FC<Buttonprops> = ({ text, className = "" }) => {
  return (
    <button className={`bg-transparent shadow-md border-[1.2px] border-gray-300 text-black rounded-full px-4 py-2 hover:bg-gray-100 transition-all duration-300 ease-in-out hover:scale-[1.03] ${className}`}>
      {text}
    </button>
  );
}

const BlueButton: React.FC<{ text: string }> = ({ text }) => {
  return (
    <button className='border-[#0076D3] bg-transparent border-[1.5px] mx-3 text-black rounded-lg px-3 py-1 hover:bg-gray-50 transition-all duration-300 ease-in-out hover:scale-[1.03]'>
      {text}
    </button>
  );
}
type Buttonprops = {
  text: string;
  className?: string;
};

const BlackButton: React.FC<Buttonprops> = ({ text, className = "" }) => {
  return (
    <button className={`border-[black] bg-transparent border-[1.5px] mx-3 text-black rounded-lg px-3 py-1 hover:bg-gray-50 transition-all duration-300 ease-in-out hover:scale-[1.03] ${className}`}>
      {text}
    </button>
  );
};

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
const HeadingDescription: React.FC<{ heading: string; description: string }> = ({ heading, description }) => {
  return (
    <div className='flex gap-2 flex-col my-2'>
      <h1 className='text-3xl font-extrabold'>{heading}</h1>
      <p className='text-gray-400'>{description}</p>
    </div>
  );

}

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

const HorizontalLine: React.FC = () => {
  return (
    <div className='w-[98%] mx-auto h-[1.2px] rounded-full bg-gray-300 my-2' />
  );
}

const Tab: React.FC<{ label: string; isActive: boolean; onClick: () => void; className?: string }> = ({ label, isActive, onClick, className = "" }) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-all duration-300 ease-in-out ${isActive ? 'text-black border-b-[3px] font-extrabold text-4xl border-gray-300' : 'text-gray-400 text-2xl'
        } ${className}`}
    >
      {label}
    </div>
  );
};

const Tabs: React.FC<{ tabs: string[]; activeTab: string; onTabChange: (tab: string) => void; className?: string }> = ({ tabs, activeTab, onTabChange, className = "" }) => {
  return (
    <div className={`flex justify-center w-[98%] mx-auto border-b-[2px] border-gray-200 ${className}`}>
      {tabs.map((tab) => (
        <Tab
          key={tab}
          label={tab}
          isActive={activeTab === tab}
          onClick={() => onTabChange(tab)}
        />
      ))}
    </div>
  );
};

const Table: React.FC<{ headers: string[]; rows: React.ReactNode[] }> = ({ headers, rows }) => {
  return (
    <div className='w-[98%] mx-auto my-4 h-fit'>
      <table className='w-full border-collapse shadow-md border-[1.2px] border-gray-100'>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="p-3 border-b-2 border-gray-300 text-middle text-gray-600 font-semibold text-sm uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <React.Fragment key={index}>{row}</React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TableRow: React.FC<{ cells: React.ReactNode[] }> = ({ cells }) => {
  return (
    <tr>
      {cells.map((cell, index) => (
        <td
          key={index}
          className="p-3 border-b-2 border-gray-300 text-center align-middle"
        >
          {cell}
        </td>
      ))}
    </tr>
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
        headers={['ID', 'Trade', 'Buyer', 'Product', 'Nogoation', 'Request Anaylsis', 'Request']}
        rows={[
          <TableRow cells={['123344823', 'Trade Terms', 'Max Sharma', 'XXXXXX', 'Check INCO-TERMS', '', <div className='flex'><GreenButton text="Accept" /><RedButton text="Decline" /></div>]} />,
          <TableRow cells={['123344823', 'Trade Terms', 'Max Sharma', 'XXXXXX', 'Check INCO-TERMS', '', <div className='flex'><GreenButton text="Accept" /><RedButton text="Decline" /></div>]} />,


        ]}
      />



    </div>

  );
}

const PurchaseOrder: React.FC = () => {
  return (
    <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>

      <div className='flex w-full justify-between'>
        <HeadingDescription heading='Purchase Order' description='Check whether the things are their or not' />
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
        headers={['ID', 'Trade', 'Buyer', 'Product', 'Request Anaylsis', 'Request']}
        rows={[
          <TableRow cells={['123344823', 'Trade Terms', 'Max Sharma', 'XXXXXX', 'xx%', <BlackButton text="Confirm Order" />]} />,
          <TableRow cells={['123344823', 'Trade Terms', 'Max Sharma', 'XXXXXX', 'XX%', <BlackButton text="Confirm Order" />]} />,


        ]}
      />



    </div>

  );
}

const OngoingTrades: React.FC = () => {
  return (
    <div className='flex justify-between flex-col w-[98%] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg p-6 bg-white'>

      <div className='flex w-full justify-between'>
        <HeadingDescription heading='Purchase Order' description='Check whether the things are their or not' />
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
        headers={['ID', 'Date', 'Status', 'Customer', 'Product', 'Revenue']}
        rows={[
          <TableRow cells={['123344823', '', '', 'Max Sharma', 'xxxxxx', '$1299']} />,
          <TableRow cells={['123344823', '', '', 'Max Sharma', 'xxxxxx', '$1299']} />,


        ]}
      />



    </div>

  );
}

const PreviousTrades: React.FC = () => {
  return (
    <div id="trade-history" className="flex flex-col rounded-lg shadow-lg border-[1px] border-gray-300 w-[98%] mx-auto my-16 bg-white">
      <div id="trade-history-header" className="flex bg-black rounded-t-lg">

        <div id="trade-history-header-left" className="flex w-[55%] justify-between p-3 text-gray-400">
          <div className="mx-3">
            <p>ORDERPLACED</p>
            <p>10 January 2025</p>
          </div>

          <div className="mx-3">
            <p>Total</p>
            <p>xxxxxxxxx</p>
          </div>

          <div className="mx-3">
            <p>Ship to</p>
            <p className='text-[#0076D3]'>Max Sharma </p>
          </div>
        </div>
        <div id="trade-history-header-right" className="flex w-fit justify-between p-3 text-gray-400 ml-auto mr-3">
          <div>
            <h2 className='text-lg font-bold text-blue-50 '>Order # 12445382492-232323</h2>
            <div className='flex gap-2'>
              <button className='text-[#0076D3] border-r border-white px-2'>View order details</button>
              <button className='text-[#0076D3]'>Invoice</button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex my-4" id="order-section-bottom">
        <div className="w-fit ml-2 mr-auto flex flex-col" id="left">
          <div className="flex flex-col m-2">
            <h2 className='text-3xl font-bold'>Delivered 13 January</h2>
            <p className='font-medium text-lg'>Packge was handed to xxxx</p>
            <div className='h-[200px] w-[200px] bg-[#D9D9D9] rounded-md my-4'></div>
          </div>

        </div>
        <div className="w-fit m-auto flex flex-col" id="mid">
          <div className='flex flex-col m-2'>
            <p>---------------------------------</p>
            <BlackButton className="border-gray-300 shadow-lg my-2" text="Sell Again" />
            <BlackButton className="border-gray-300 shadow-lg my-2" text="View your item" />
          </div>
        </div>
        <div className="w-fit m-auto flex flex-col" id="right">
          <BlackButton className="my-2 border-gray-400 shadow-md" text="Check Trade Terms" />
          <BlackButton className="my-2 border-gray-400 shadow-md" text="Ask Buyer Queries" />
          <BlackButton className="my-2 border-gray-400 shadow-md" text="Leave Seller Feedback" />
          <BlackButton className="my-2 border-gray-400 shadow-md" text="Invoice" />
        </div>
      </div>
    </div>
  );
}

const TradeHistory: React.FC = () => {
  return (
    <div>
      <PreviousTrades />
      <PreviousTrades />
    </div>
  );
}

const TrackTrade: React.FC<{ orders?: React.ReactNode[] }> = ({ orders = [] }) => {
  return (
    <div className='flex flex-col w-[98%] h-[50vh] mx-auto my-16 shadow-lg border-[1px] border-gray-300 rounded-lg bg-white'>
      <div id="left" className='flex flex-col h-full overflow-y-scroll'>
        <div id="header" className='flex border-b-[2px] border-gray-300 px-6 py-3 bg-white sticky top-0'>
          <h1 className='text-3xl font-semibold'>Trades</h1>
        </div>
        <div className='flex flex-col w-full overflow-y-auto flex-1'>
          {/* Track orders */}
          {orders.map((order, index) => (
            <React.Fragment key={index}>
              {order}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div id="right" className='flex flex-col w-[0%]'>

      </div>
    </div>
  );
}

const Trackconsignment: React.FC = () => {
  return (
    <div className="flex my-2 mx-auto w-[98%] p-3 rounded-lg cursor-pointer justify-between hover:bg-gray-100">
        <div className='flex h-[80px] w-[80px] bg-[#D5D5D5] rounded-lg my-auto'></div>
        <p className=" my-auto">Courier</p>
        <p className=" my-auto">............</p>
        <h2 className="font-semibold my-auto">lk23 43 5343</h2>
        <h2 className="font-semibold my-auto">25 Jan 2022</h2>
        <h2 className="font-semibold my-auto">Transit</h2>
        <h2 className="font-semibold my-auto">$10</h2>
    </div>
  );
}

type RatingsProps = {
  reviews: number[]; // Array of review counts for [5, 4, 3, 2, 1] stars
};

const Ratings: React.FC<RatingsProps> = ({ reviews }) => {
  // reviews: [count5, count4, count3, count2, count1]
  const totalReviews = reviews.reduce((sum, count) => sum + count, 0);
  const average =
    totalReviews === 0
      ? 0
      : (
          reviews.reduce(
            (sum, count, idx) => sum + count * (5 - idx),
            0
          ) / totalReviews
        ).toFixed(1);

  return (
    <div className="flex flex-col items-start w-full p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Feedback Summary</h2>
      <div className="flex flex-col gap-2 w-full mb-6">
        {[5, 4, 3, 2, 1].map((star, idx) => {
          const count = reviews[5 - star];
          const percent =
            totalReviews === 0 ? 0 : (count / totalReviews) * 100;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="font-semibold">{star}</span>
              <svg width="18" height="18" fill="#FFC107" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
              <div className="relative flex-1 h-3 bg-yellow-100 rounded">
                <div
                  className="absolute left-0 top-0 h-3 bg-yellow-400 rounded"
                  style={{
                    width: `${percent}%`
                  }}
                />
              </div>
              <span className="ml-2 text-gray-500 text-xs">{count}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center mt-2">
        <span className="font-bold text-xl mr-2">Average Rating :</span>
        <span className="font-bold text-xl mr-2">{average}</span>
        <svg width="22" height="22" fill="#FFC107" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      </div>
    </div>
  );
};

type ProductNameProps = {
  name: string;
};

const ProductName: React.FC<ProductNameProps> = ({ name }) => {
  return (
    <div className="flex flex-col w-full p-6 bg-white rounded-lg shadow-md border border-gray-200 my-6">
      <h2 className="text-2xl font-bold mb-4">{name}</h2>
      <div className="w-full h-48 bg-black rounded-xl border-2 border-blue-400 mb-6"></div>
      <div className="flex flex-col gap-2">
        <div className="h-2 bg-gray-300 rounded w-3/4" />
        <div className="h-2 bg-gray-300 rounded w-2/3" />
        <div className="h-2 bg-gray-300 rounded w-1/4" />
      </div>
    </div>
  );
};

type Review = {
  user: string;
  date: string;
  content: string;
};

type ProductReviewsProps = {
  reviews: Review[];
  total: number;
  max: number;
};

const ProductReviews: React.FC<ProductReviewsProps> = ({ reviews, total, max }) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-4 my-6 h-[96%] overflow-y-scroll">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold cursor-pointer">Product Reviews</h2>
        <span className="text-gray-500 text-sm">{total}/{max}</span>
      </div>
      <div className="flex flex-col gap-4">
        {reviews.map((review, idx) => (
          <div key={idx} className="flex items-start bg-gray-50 rounded-lg p-4">
            <div className="w-10 h-10 rounded-full bg-black flex-shrink-0 mr-4" />
            <div>
              <p className="text-gray-700">{review.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Feedback: React.FC = () => {
  // Example data
  const reviews = [10, 5, 2, 1, 0];
  const reviewList = [
    { user: 'John Doe', date: '2023-10-01', content: 'I purchased the 1.5 Ton 4 Star AC 10-days ago, and until now I am impressed with what it has to offer. To give you guys a better idea, let me go through the whole experience.' },
    { user: 'Jane Smith', date: '2023-10-02', content: 'I purchased the 1.5 Ton 4 Star AC 10-days ago, and until now I am impressed with what it has to offer. To give you guys a better idea, let me go through the whole experience.' },
    { user: 'Alice Johnson', date: '2023-10-03', content: 'I purchased the 1.5 Ton 4 Star AC 10-days ago, and until now I am impressed with what it has to offer. To give you guys a better idea, let me go through the whole experience.' },
  ];

  return (
    <div className="flex flex-row gap-8 w-fit mt-12 mb-8 my-auto mx-auto">
      <div className="flex-1 min-w-[340px] max-w-[420px]">
        <ProductName name="Product Name" />
        <Ratings reviews={reviews} />
      </div>
      <div className="flex-1 min-w-[340px] max-w-[600px]">
        <ProductReviews reviews={reviewList} total={8} max={50} />
      </div>
    </div>
  );
};


// Main Trade component

const Trade: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('Purchase Request Status'); // Default active tab

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    console.log("Selected tab:", tab);
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'Purchase Request Status':
        return <PurchaseRequestStatus />;
      case 'Purchase Order':
        return <PurchaseOrder />;
      case 'Ongoing Trades':
        return <OngoingTrades />;
      case 'Track Trade':
        return <TradeHistory />;
      case 'Trade History':
        return <TrackTrade orders={[<Trackconsignment />, <Trackconsignment />]} />;
      default:
        return null;
    }
  };

  return (
    <div className='w-[95%] mx-auto my-4 h-fit flex flex-col'>

      <div className='flex w-[98%] mx-auto my-12'>
        <Search />
        <RoundedButton className='mx-6' text='Search Trades' />
      </div>

      <Tabs
        tabs={['Purchase Request Status', 'Purchase Order', 'Ongoing Trades', 'Track Trade', 'Trade History']}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {renderActiveTabContent()}
    
    
      

    </div>
  );
};


export{Trade,Tabs,Table,TableRow,PurchaseRequestStatus,PurchaseOrder,OngoingTrades,TrackTrade,Trackconsignment,Ratings,ProductName,ProductReviews,Feedback};