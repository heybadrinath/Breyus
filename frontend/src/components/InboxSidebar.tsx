import React, { ChangeEvent } from "react";
import { InboxSidebarProps } from "../types/inboxTypes";
import { Filter } from "lucide-react";

const inboxSidebar: React.FC<InboxSidebarProps> = ({
    conversations,
    unreadCount,
    onConversationSelect
}) => {


    return (
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-5 border-b border-gray-200 bg-white flex">
                <h2 className="m-0 text-2xl font-semibold text-gray-900">
                    Inbox
                    {unreadCount && <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs ml-2">
                        {unreadCount}
                    </span>}
                </h2>

                <Filter size={22} className="my-auto ml-auto cursor-pointer text-gray-400" />

            </div>

            <div className="flex-1 overflow-y-auto">

                {conversations.map((conversation) => (
                    <div onClick={() => onConversationSelect(conversation.id)} key={conversation.id} id={conversation.id} className={`p-4 border-b border-gray-100 cursor-pointer transition-colors `}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold text-lg">
                                {conversation.name.charAt(0)}
                            </div>

                            {/* Conversation Info */}


                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="m-0 text-base font-semibold text-gray-900 truncate">
                                        {conversation.name}
                                    </h4>
                                    <span className="text-xs text-gray-500">
                                        {conversation.time}
                                    </span>
                                </div>

                                {/* Product info if trade-related */}
                                <div className="text-xs text-[#867C5B] mb-0.5 flex">
                                    📦 {conversation.productInfo}
                                    {/* Unread indicator */}
                                    {conversation.isUnread && <div className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold ml-auto">
                                        {conversation.unreadCount}
                                    </div>}
                                </div>



                                {/* Last message */}
                                <p className="m-0 text-sm text-gray-600 truncate">
                                    {conversation.message.length > 0 ? conversation.message[conversation.message.length - 1].text : "No messages yet"}                                </p>
                            </div>


                        </div>
                    </div>
                ))}

            </div>
        </div>
    )
};

export default inboxSidebar;