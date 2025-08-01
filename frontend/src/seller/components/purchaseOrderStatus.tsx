import React from "react";
import { Filter } from "lucide-react";


export const PurchaseOrderStatus = () => {
    return (
                <div className="border-2 rounded-lg my-8 ">
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

                </div>
    )
}