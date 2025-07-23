import React, { useState } from "react";
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Send } from 'lucide-react';
import { InboxConversationProps } from "../types/inboxTypes";


const InboxConversation: React.FC<InboxConversationProps> = ({ name, productName, messages, onAttachFile, onSendMessage }) => {
    const [message, setMessage] = useState<string>("");

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            onSendMessage(message);  
            setMessage("");  
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    return (
        <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header " */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">


                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
                        {name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="m-0 text-lg font-semibold text-gray-900">
                            {name}
                        </h3>
                        <p className="m-0 text-xs text-[#867C5B]">
                            Product: {productName}
                        </p>
                    </div>
                </div>

            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50">

                {messages.map((message, index) => (
                    <div className={`flex mb-4 ${(!message.isSender) ? "justify-end" : "justify-start"}`}>
                        <div key={index} className={`max-w-[70%] p-3.5 rounded-2xl shadow-sm relative ${(!message.isSender) ? "bg-gray-600 text-white" : "bg-white text-gray-900"}`}>
                            <div className="text-base leading-tight break-words">
                                {message.text}
                            </div>
                            <div className="text-xs opacity-70 mt-1 text-right">
                                {message.time}
                            </div>
                        </div>
                    </div>))}

            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-3">
                    <button className="bg-transparent border-none cursor-pointer p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                        <Paperclip size={20} />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            placeholder="Type a message..."
                            className="w-full py-2.5 pl-4 pr-10 border border-gray-300 rounded-full text-base outline-none resize-none max-h-32 min-h-[44px]"
                            value={message}
                            onChange={handleMessageChange}
                            onKeyDown={handleKeyPress}
                        />

                    </div>

                    <button
                    onClick={handleSendMessage}
                        className="bg-gray-600 text-white border-none rounded-full w-11 h-11 cursor-pointer flex items-center justify-center transition-colors hover:bg-gray-700 disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={!message.trim()}

                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
export default InboxConversation;