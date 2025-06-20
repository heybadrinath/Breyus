import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import BreyusLogo from "../../seller/vectors/full-logo.svg";

interface SellerCardProps {
    company: string;
    country: string;
    contactNumber: string;
    productDescription: string;
    product: string;
    companyAddress: string;
    price: string;
    hsnCode: string;
}

const Navbar = ({ onSearchResults }: { onSearchResults: (results: SellerCardProps[]) => void }) => {
    const navigate = useNavigate();
    return (
        <div className="border-b border-gray-200 px-2 py-2 flex">
            <div className="my-auto">
                <img className="h-auto w-[180px]" src={BreyusLogo} alt="Breyus" />
            </div>
            <div className="flex w-[40%] justify-between my-auto mx-auto font-[500] xl:text-lg lg:text-md md:text-sm">
                <SearchBar onSearchResults={onSearchResults} />
            </div>
        </div>
    );
};

const SearchBar = ({ onSearchResults }: { onSearchResults: (results: SellerCardProps[]) => void }) => {
    const [query, setQuery] = useState('');
    const location = useLocation();

    const fetchResults = async (input: string) => {
        try {
            const res = await fetch("https://breyus.com/search/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: input }),
            });
	    console.log(res);
            const data = await res.json();
            const formattedResults = data.matches?.map((item: any) => ({
                company: item.Company,
                country: item.Country,
                contactNumber: item["Contact number"],
                productDescription: item["Product description"],
                product: item.Product,
                companyAddress: item["Company address"],
                price: item.Price,
                hsnCode: item["HS Code"]
            }));
            onSearchResults(formattedResults || []);
        } catch (error) {
            console.error("Search failed", error);
            onSearchResults([]);
        }
    };

    useEffect(() => {
        const state = location.state as { query?: string };
        state?.query && fetchResults(state.query);
    }, [location.state]);

    const handleSearch = () => query.trim() && fetchResults(query);

    return (
        <div className="w-full">
            <div className="flex items-center border border-gray-200 rounded-full px-4 py-2 w-full max-w-xl shadow-sm">
                <svg className="mr-6" width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M9.66667 16.3333C13.3486 16.3333 16.3333 13.3486 16.3333 9.66667C16.3333 5.98477 13.3486 3 9.66667 3C5.98477 3 3 5.98477 3 9.66667C3 13.3486 5.98477 16.3333 9.66667 16.3333Z" stroke="#667085" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 19L14.375 14.375" stroke="#667085" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
        </div>
    );
};

const SellerCard = ({
    company,
    country,
    contactNumber,
    productDescription,
    product,
    companyAddress,
    price,
    hsnCode
}: SellerCardProps) => {
  return (
    <div className="flex flex-col md:flex-row p-6 border rounded-xl gap-6 max-w-6xl mx-auto bg-white shadow-lg my-8">
      <div className="flex gap-4 min-w-[400px]">
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-16 h-16 border-2 rounded-lg bg-gray-50"></div>
          ))}
        </div>
        <div className="w-80 h-80 border-2 rounded-xl bg-gray-50"></div>
      </div>

      <div className="flex flex-col justify-between flex-1 gap-6 p-4">
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{product}</h1>
            <h2 className="text-xl text-gray-600">{company}</h2>
          </div>
          
          <div className="space-y-3 mb-8">
            <p className="text-lg">
              <strong>HSN Code:</strong> {hsnCode}
            </p>
            <p className="text-lg">
              <strong>Country of Origin:</strong> {country}
            </p>
            <p className="text-lg">
              <strong>Address:</strong> {companyAddress}
            </p>
            <p className="text-lg">
              <strong>Price:</strong> Negotiable
            </p>
            <p className="text-lg">
              <strong>Contact:</strong> N/A
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Product Description:</h3>
            <p className="text-gray-700 leading-relaxed text-justify">
              {productDescription}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
              Seller Quality of Trade
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
              Price Fluctuation Predictions
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6 mt-8 pt-6 border-t border-gray-200">
          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
            <span className="text-xl">💬</span>
            <span className="font-medium">Chat</span>
          </button>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <button className="flex items-center space-x-2 text-pink-600 hover:text-pink-800">
            <span className="text-xl">♡</span>
            <span className="font-medium">Wishlist</span>
          </button>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
            <span className="text-xl">🔗</span>
            <span className="font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Products = () => (
    <div className="grid grid-cols-4 mx-24 justify-center my-8">
        {[...Array(16)].map((_, i) => <ProductCard key={i} />)}
    </div>
);

const App = () => {
    const [searchResults, setSearchResults] = useState<SellerCardProps[]>([]);

    return (
        <div className="container mx-auto px-4">
            <Navbar onSearchResults={setSearchResults} />
            {searchResults.length > 0 ? (
                <div className="space-y-8">
                    {searchResults.map((result, i) => (
                        <SellerCard 
                            key={i}
                            company={result.company}
                            country={result.country}
                            contactNumber={result.contactNumber}
                            productDescription={result.productDescription}
                            product={result.product}
                            companyAddress={result.companyAddress}
                            price={result.price}
                            hsnCode={result.hsnCode}
                        />
                    ))}
                </div>
            ) : (
                <Products />
            )}
        </div>
    );
};

export default App;
