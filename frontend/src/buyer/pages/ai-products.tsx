import React, { JSX, ReactNode, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";


// logo imports 
import BreyusLogo from "../../seller/vectors/full-logo.svg";

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <div className="border-b border-gray-200 px-2 py-2 flex">
            <div id="logo" className="my-auto">
                <img className="h-auto w-[180px]" src={BreyusLogo} alt="Breyus" />
            </div>
            <div id="Search" className="flex w-[40%] justify-between my-auto mx-auto font-[500] xl:text-lg lg:text-md md:text-sm">
                <SearchBar />
                <Button onClick={() => navigate("/buyer/signup")} className=" md:text-sm md:px-8">Filter</Button>

            </div>

        </div>
    )
};


const SellerCard = () => {
  return (
    <div className="flex flex-col md:flex-row p-6 border rounded-xl gap-6 max-w-6xl mx-auto w-fit absolute top-[20%] py-24 bg-white shadow-lg left-[20%]">
      {/* Sidebar and Main Image */}
      <div className="flex gap-4">
        {/* Sidebar Images */}
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-10 h-10 border rounded-md bg-gray-100"></div>
          ))}
        </div>

        {/* Main Image */}
        <div className="w-80 h-80 border rounded-xl bg-gray-100"></div>
      </div>

      {/* Right Content */}
      <div className="flex flex-col justify-between flex-1 gap-6">
        {/* Info Section */}
        <div>
          <h2 className="text-xl font-semibold">Noval Pvt LTD :</h2>
          <p className="mt-1">
            <strong>Country of Origin:</strong> India, Karntaka, Bengluru
          </p>
          <p>
            <strong>Contact number :</strong> +91 xxxxxxxx52
          </p>

          {/* About Section */}
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold">
              About <span className="text-black">Noval</span> :
            </h3>
            <p className="text-sm text-gray-700 mt-2 leading-relaxed">
              At Noval Sustainability Solutions, we believe that sustainability and commerce can coexist harmoniously. 
              By leveraging our waste management expertise and global trade capabilities, we strive to create a circular economy, 
              where waste is minimized, and resources are optimized for maximum efficiency and minimal environmental impact.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button className="flex items-center gap-3 px-4 py-3 border rounded-md bg-gray-100 font-semibold text-left">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
            Seller Quality of Trade
          </button>
          <button className="flex items-center gap-3 px-4 py-3 border rounded-md bg-gray-100 font-semibold text-left">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
            Price Fluctuation Predections
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-6 text-sm text-gray-600 mt-2">
          <button className="flex items-center gap-1">💬 Chat</button>
          <div className="h-4 w-px bg-gray-400"></div>
          <button className="flex items-center gap-1">♡ Wishlist</button>
          <div className="h-4 w-px bg-gray-400"></div>
          <button className="flex items-center gap-1">🔗 Share</button>
        </div>
      </div>
    </div>
  );
};

const Products = () =>(
    <div className="grid grid-cols-4 mx-24 justify-center my-8">
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
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />

    </div>
)

export default () => {
    return (
        <div>
            <Navbar />
            <Products />
            <SellerCard />
        </div>
    );
}


// components 

type ButtonProps = {
    onClick?: () => void;
    className?: string;
    children: ReactNode;
};

const Button: React.FC<ButtonProps> = ({ onClick, className = '', children }) => (
    <button onClick={onClick}
        className={`${className} px-12 py-3 mx-6 my-2 border-gray-300 border rounded-xl font-semibold transition-all hover:scale-105`}>
        {children}
    </button>
);

const SearchBar = (): JSX.Element => {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        console.log('Search for:', query);
    };

    return (
        <div className="flex items-center border border-gray-200 rounded-full px-4 py-2 w-full max-w-xl shadow-sm">
            <svg className="mr-6" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g opacity="0.5">
                    <path d="M10.0169 19.0313C14.9968 19.0313 19.0337 14.9945 19.0337 10.0147C19.0337 5.03485 14.9968 0.998047 10.0169 0.998047C5.0369 0.998047 1 5.03485 1 10.0147C1 14.9945 5.0369 19.0313 10.0169 19.0313Z" stroke="black" stroke-width="2" stroke-linejoin="round" />
                    <path d="M13.0176 6.4849C12.6239 6.09042 12.1562 5.77758 11.6413 5.56432C11.1264 5.35106 10.5744 5.24159 10.0171 5.24219C9.45977 5.24159 8.90782 5.35106 8.39291 5.56432C7.87801 5.77758 7.41029 6.09042 7.0166 6.4849M16.4997 16.4981L21.0002 20.9985" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </g>
            </svg>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Animal Protein Trader"
                className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent"
            />
        </div>
    );
};