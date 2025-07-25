import React, { useState, useEffect } from 'react';

import InboxSidebar from '../../components/InboxSidebar';
import InboxConversation from '../../components/InboxConversation';
import { ConversationProps, Message } from '../../types/inboxTypes';
import { SearchHeaderLight } from '../../components/Header';
import { getConversation } from '../../services/inbox.service';
import { set } from 'react-hook-form';

const BuyerInbox = () => {
    const [conversations, setConversations] = useState<ConversationProps[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState<number>();

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await getConversation('');
                if (response.status === 'success') {
                    setConversations(response.data);

                } else {
                    console.error('Failed to fetch conversations:', response.message);
                }
            } catch (error) {
                console.error('Error fetching conversations:', error);
            }
        };

        fetchConversations();

    }, []);



    // Handle search input
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    // Handle conversation selection
    const handleConversationSelect = (conversationId: string) => {
        setSelectedConversationId(conversationId);
    };

    // Handle sending a message in the selected conversation
    const handleSendMessage = (messageText: string) => {
        if (!selectedConversationId) return;

        // const updatedConversations = conversations.map(conv => {
        //     if (conv.id === selectedConversationId) {
        //         const newMessage: Message = {
        //             text: messageText,
        //             time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        //             isSender: false,
        //             isRead: true,
        //         };

        //         // const updatedMessages = [...conv.message, newMessage];

        //         // return {
        //         //     ...conv,
        //         //     message: updatedMessages,
        //         //     isUnread: true,  // Mark the conversation as having unread messages
        //         //     unreadCount: conv.unreadCount + 1,  // Increment the unread count
        //         // };
        //     }
        //     return conv;
        // });

        // setConversations(updatedConversations);

        // const totalUnreadCount = updatedConversations.reduce(
        // (acc, conv) => acc + conv.unreadCount,
        // 0
        // );
        // setUnreadCount(totalUnreadCount);
    };

    // const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

    return (
        <div className='h-screen flex flex-col'>
            <SearchHeaderLight />

            <div className="flex h-full bg-gray-50 font-sans">
                <InboxSidebar
                    conversations={conversations}
                    unreadCount={unreadCount || 0}
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    onConversationSelect={handleConversationSelect}
                />
                {false && (
                    // <InboxConversation
                    //     name={selectedConversation.name}
                    //     productName={selectedConversation.productInfo || ''}
                    //     messages={selectedConversation.message}
                    //     onSendMessage={handleSendMessage}  // Pass handleSendMessage as a prop
                    // />
                    <></>
                )}
            </div>
        </div>
    );
};

export default BuyerInbox;
