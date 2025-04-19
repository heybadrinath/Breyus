import React from 'react';

const Inbox: React.FC = () => {
    return (
        <div className='flex flex-col shadow-lg mx-auto my-12 bg-white rounded-lg p-4 w-[80%]'>


            <div className='flex w-full'>
                <h1 className='text-2xl font-bold'>Messages</h1>
                <button className='pl-12 pr-16 py-1 bg-[#E7E7E7] rounded-lg ml-12 my-auto'>Search Messages</button>
                <div className='flex ml-auto mr-2 my-auto cursor-pointer' id="dotmenu">
                    <div className={"p-1 rounded-lg bg-[#353535] m-1"}></div>
                    <div className={"p-1 rounded-lg bg-[#353535] m-1"}></div>
                    <div className={"p-1 rounded-lg bg-[#353535] m-1"}></div>
                </div>
            </div>

            <hr className='h-0 p-[0.3px] mt-3 rounded-2xl bg-[#E7E7E7]' />


            <div className='flex mt-2'>
                <div className='mx-6 my-auto px-8 border-r-2 border-black'><div className='flex bg-[#E7E7E7] rounded-lg px-20 py-6'></div></div>
                <div className='flex bg-[#E7E7E7] rounded-lg px-20 py-6 mx-6'></div>
                <div className='flex bg-[#E7E7E7] rounded-lg px-20 py-6 mx-6'></div>
                <div className='flex bg-[#E7E7E7] rounded-lg px-20 py-6 mx-6'></div>
            </div>
            <hr className='h-0 p-[0.3px] mt-3 rounded-2xl bg-[#E7E7E7]' />

            <div className='flex mt-2'>
                <div className='flex flex-col h-full'>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">Seller-1</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">Seller-2</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">Buyer-1</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">......</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">......</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">......</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">......</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-[#35353540]">......</div>
                </div>

                <div className='flex flex-col m-4 w-full'>
                    <div className='h-full flex' id="Message-box">
                        <div className='flex flex-col w-full'>
                            <div className='flex justify-start mb-4'>
                                <div className='bg-[#E7E7E7] text-black px-4 py-2 rounded-lg max-w-[70%] shadow'>
                                    Hello! How can I help you today?
                                </div>
                            </div>
                            <div className='flex justify-end mb-4'>
                                <div className='bg-[#353535] text-white px-4 py-2 rounded-lg max-w-[70%] shadow'>
                                    Hi! I have a question about my order.
                                </div>
                            </div>
                            <div className='flex justify-start mb-4'>
                                <div className='bg-[#E7E7E7] text-black px-4 py-2 rounded-lg max-w-[70%] shadow'>
                                    Sure, please let me know the details.
                                </div>
                            </div>
                            <div className='flex justify-end mb-4'>
                                <div className='bg-[#353535] text-white px-4 py-2 rounded-lg max-w-[70%] shadow'>
                                    I received the wrong item. Can you assist?
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className=' w-full' id="input-box">
                        <input className='border-[#35353540] w-full border-x border-y px-8 py-2 outline-none rounded-lg' placeholder='Write here...........' type="text" />
                    </div>
                </div>

            </div>

        </div>);
};

export default Inbox;