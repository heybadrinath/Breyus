import { Filter, Check, X } from "lucide-react";
import { TableRow } from "./tableRow";


export const PurchaseOrderStatus = () => {
    return (
        <div className="border-t-2 border-x-2 rounded-lg my-8 h-full">
            <div className="p-8 flex-col flex">
                <div className="flex">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-700">Purchase Order</h1>
                        <span className="text-gray-500">Check weather the things are their or not</span>
                    </div>
                    <Filter className="ml-auto " />
                </div>
                <div className="flex mt-8">
                    <select id="entries" className=" w-fit bg-white border-2 rounded-lg px-2 py-1 ">
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                    </select>
                    <label className="ml-2 text-gray-500" htmlFor="entries">entries per page</label>
                </div>

            </div>

            <table className="w-full">
                <tr className="border-b-2">
                    <th className=" text-gray-600 font-medium py-2">Trade</th>
                    <th className=" text-gray-600 font-medium py-2">Buyer</th>
                    <th className=" text-gray-600 font-medium py-2">Product</th>
                    <th className=" text-gray-600 font-medium py-2">Negotiation</th>
                    {/* <th className=" text-gray-600 font-medium py-2">Request Analysis</th> */}
                    <th className=" text-gray-600 font-medium py-2">Request</th>
                </tr>
                <TableRow tableData={[
                    <button className="text-[#0076D3]">Trade terms</button>,
                    "User",
                    "Copper",
                    <button className="text-[#0076D3]">Check Buyer Terms</button>,
                    // "10% match",
                    <div className="flex w-full justify-items-center justify-center">
                        <button className="border-2 border-green-400 rounded-full p-[0.4px] mr-3"><Check className=" text-green-400 " /></button>
                        <button className="border-2 rounded-full p-[0.4px] border-red-400"><X className="text-red-400"/></button>
                    </div>
                ]} />

                 <TableRow tableData={[
                    <button className="text-[#0076D3]">Trade terms</button>,
                    "User",
                    "Copper",
                    <button className="text-[#0076D3]">Check Buyer Terms</button>,
                    // "10% match",
                    <div className="flex w-full justify-items-center justify-center">
                        <button className="border-2 border-green-400 rounded-full p-[0.4px] mr-3"><Check className=" text-green-400 " /></button>
                        <button className="border-2 rounded-full p-[0.4px] border-red-400"><X className="text-red-400"/></button>
                    </div>
                ]} />
                

            </table>

        </div>
    )
}