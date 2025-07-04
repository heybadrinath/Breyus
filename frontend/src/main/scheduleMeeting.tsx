import React from "react";


const ScheduleMeeting = () => {

    return (
        <div className="h-screen w-screen flex">
            <div className="m-auto flex flex-col w-[80%] h-[70%] bg-white border-gray-200 border rounded-lg p-10">
                <div className="flex mx-auto w-fit mt-auto mb-10 flex-col">
                    <h1 className="text-2xl font-bold text-center">Schedule a meeting to unlock your Seller Dashboard</h1>
                    <p className="text-center">Breyus will verify your identity before granting access. <br /> while onboarding if you have selected Buyer then you can access your Buyer Dashboard now!</p>
                    <button onClick={() => window.location.href='https://calendly.com/breyuscrew/30min'} className="mt-4 bg-black text-white w-fit mx-auto px-4 py-2 rounded-lg hover:scale-[1.05] transition-all duration-300 ease-in-out">Schedule Meeting</button>
                </div>
            </div>
        </div>
    );
}

export default ScheduleMeeting;