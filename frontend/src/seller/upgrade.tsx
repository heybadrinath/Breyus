import React from "react";

const Upgrade = () => {
    return (
        <div className="h-[85vh] flex">
            <div className="border-2 shadow-lg border-[#cccc] w-fit px-20 py-16 rounded-lg mx-auto my-auto flex h-fit flex-col">
                <h1 className="w-fit m-auto font-extrabold text-4xl">This is a premium Feature</h1>
                <p className="w-fit m-auto font-bold text-sm">upgrade now to understand why your users Dropped off</p>
                <button className="w-fit mx-auto my-4 bg-black text-white text-sm px-20 py-2 rounded-lg">Upgrade to core</button>
            </div>
        </div>
    );
};

export default Upgrade;