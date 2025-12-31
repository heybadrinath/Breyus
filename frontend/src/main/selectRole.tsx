import React from "react";
import { useNavigate } from "react-router-dom";
import SellerImage from "../assets/select-role/seller.svg";
import BuyerImage from "../assets/select-role/buyer.svg";

const SelectRole = () => {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-screen flex">
            <div className="m-auto flex flex-col w-[80%] h-[80%] bg-white border-gray-200 border rounded-lg p-10">
                <div className="flex mx-auto w-fit gap-40 my-auto">
                    <div className="flex flex-col my-auto hover:scale-105 transition-all duration-300">
                        <div onClick={() => { navigate('/buyer/homepage') }} className="cursor-pointer px-16 py-2 border-gray-300 border rounded-md ">
                            <img src={BuyerImage} alt="Buyer" className=" inline-block auto translate-y-[9.5px]" />
                        </div>
                        <p className="mx-auto my-1 font-bold">I am a Buyer</p>
                    </div>

                    <div className="flex flex-col my-auto hover:scale-105 transition-all duration-300">
                        <div onClick={() => { navigate('/seller/dashboard') }} className="cursor-pointer px-16 py-2 border-gray-300 border rounded-md flex">
                            <img src={SellerImage} alt="Seller" className=" inline-block mx-auto translate-y-6" />
                        </div>
                        <p className="mx-auto my-1 font-bold">I am a Seller</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectRole;