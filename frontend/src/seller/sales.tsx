import React from "react";

// demo data 
let sales = 230220;
let salesIncrease = 55;
let customers = 3.200;
let customersIncrease = 12;
let Revenue = 34000;
let revenueincrease = 35;
let AvereageRevenue = 1.200;
let AvereageRevenueIncrease = 213;

const Sales = () => {
    return (
        <div className="flex flex-col m-4">
            <div className="flex flex-col m-4">
                <h1 className="font-extrabold text-4xl">Sales</h1>
                <p className="text-[#353535]">Check the sales, value and bounce rate by country</p>
            </div>

            {/* Sales section  */}
            <div className="flex">
                <div className="shadow-lg p-4 rounded-lg w-full mx-8 border-[#cccccc] border-2">
                    <p className="text-[#353535]">Sales</p>
                    <h1 className=" text-[#353535] text-3xl">{"$" + sales.toLocaleString()}</h1>
                    <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
                    <p className="text-[#acabab]"> <span className=" text-[#71DE5F]  " >+{salesIncrease + "%"}</span> than last month</p>
                </div>

                <div className="shadow-lg p-4 rounded-lg w-full mx-8 border-[#cccccc] border-2">
                    <p className="text-[#353535]">Customers</p>
                    <h1 className=" text-[#353535] text-3xl">{"$" + customers.toLocaleString()}</h1>
                    <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
                    <p className="text-[#acabab]"> <span className=" text-[#71DE5F]  " >+{customersIncrease + "%"}</span> since last month</p>
                </div>

                <div className="shadow-lg p-4 rounded-lg w-full mx-8 border-[#cccccc] border-2">
                    <p className="text-[#353535]">Revenue</p>
                    <h1 className=" text-[#353535] text-3xl">{"$" + Revenue.toLocaleString()}</h1>
                    <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
                    <p className="text-[#acabab]"> <span className=" text-[#71DE5F]  " >+{revenueincrease + "%"}</span> than last month</p>
                </div>

                <div className="shadow-lg p-4 rounded-lg w-full mx-8 border-[#cccccc] border-2">
                    <p className="text-[#353535]">Average Revenue</p>
                    <h1 className=" text-[#353535] text-3xl">{"$" + AvereageRevenue.toLocaleString()}</h1>
                    <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
                    <p className="text-[#acabab]"> <span className=" text-[#71DE5F]  " >+{"$"+AvereageRevenueIncrease}</span> than last week</p>
                </div>
            </div>
        </div>
    );
};

export default Sales;