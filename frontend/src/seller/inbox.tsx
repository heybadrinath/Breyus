import React, { useState, useEffect, useRef } from 'react';
import chatService, { Message } from '../services/chat.service';

const Inbox: React.FC = () => {
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [chatRoomId, setChatRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [contacts, setContacts] = useState([
        { id: 'seller-1', name: 'Seller-1' },
        { id: 'seller-2', name: 'Seller-2' },
        { id: 'buyer-1', name: 'Buyer-1' },
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' },
    ]);
    const messageEndRef = useRef<HTMLDivElement>(null);
    const userId = 'current-user'; // In a real app, get from auth context/service

    useEffect(() => {
        // Connect to socket server when component mounts
        const socket = chatService.connect(userId);

        // Listen for new messages
        chatService.onNewMessage((message: Message) => {
            setMessages(prevMessages => [...prevMessages, message]);
        });

        return () => {
            // Disconnect when component unmounts
            chatService.disconnect();
        };
    }, []);

    useEffect(() => {
        // Scroll to bottom whenever messages change
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleContactSelect = async (contactId: string) => {
        setSelectedChat(contactId);
        try {
            const { roomId, messages: chatHistory } = await chatService.joinRoom(contactId);
            setChatRoomId(roomId);
            setMessages(chatHistory);
        } catch (error) {
            console.error('Error joining chat room:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatRoomId || !selectedChat) return;

        try {
            await chatService.sendMessage(chatRoomId, selectedChat, newMessage);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

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
<<<<<<< Updated upstream
                <div className='flex flex-col h-full'>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">Seller-1</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">Seller-2</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">Buyer-1</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">......</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">......</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">......</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-b border-1 border-[#35353540]">......</div>
                    <div className="flex px-36 py-6 bg-[#E7E7E7] border-[#35353540]">......</div>
=======
                <div className='flex flex-col h-full min-w-[250px]'>
                    {contacts.map(contact => (
                        <div 
                            key={contact.id}
                            className={`flex px-4 py-4 cursor-pointer ${selectedChat === contact.id ? 'bg-[#353535] text-white' : 'bg-[#E7E7E7]'} border-b border-1 border-[#35353540]`}
                            onClick={() => handleContactSelect(contact.id)}
                        >
                            {contact.name}
                        </div>
                    ))}
>>>>>>> Stashed changes
                </div>

                <div className='flex flex-col m-4 w-full h-[500px]'>
                    <div className='flex-grow overflow-y-auto flex' id="Message-box">
                        <div className='flex flex-col w-full p-2'>
                            {messages.length > 0 ? (
                                messages.map(message => (
                                    <div key={message.id} className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'} mb-4`}>
                                        <div className={`${message.senderId === userId ? 'bg-[#353535] text-white' : 'bg-[#E7E7E7] text-black'} px-4 py-2 rounded-lg max-w-[70%] shadow`}>
                                            {message.content}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className='flex justify-center items-center h-full'>
                                    <p className='text-gray-500'>Select a contact to start chatting</p>
                                </div>
                            )}
                            <div ref={messageEndRef} />
                        </div>
                    </div>
                    <form onSubmit={handleSendMessage} className='mt-4 w-full'>
                        <div className='flex'>
                            <input 
                                className='border-[#35353540] flex-grow border-x border-y px-8 py-2 outline-none rounded-lg' 
                                placeholder='Write here...........' 
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={!selectedChat}
                            />
                            <button 
                                type="submit" 
                                disabled={!selectedChat || !newMessage.trim()} 
                                className='ml-2 px-4 py-2 bg-[#353535] text-white rounded-lg disabled:opacity-50'
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Inbox;