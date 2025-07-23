import React, { useState, useEffect } from 'react';

import InboxSidebar from '../../components/InboxSidebar';
import InboxConversation from '../../components/InboxConversation';
import { ConversationProps, Message } from '../../types/inboxTypes';
import { SearchHeaderLight } from '../../components/Header';

const BuyerInbox = () => {
    const [conversations, setConversations] = useState<ConversationProps[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState<number>();

    // Mock conversations data
    useEffect(() => {
        const mockConversations: ConversationProps[] = [
            {
                id: '1',
                name: 'John Doe',
                time: '10:30 AM',
                message: [
                    {
                        text: 'Hi, is the lamp still available?',
                        time: '10:30 AM',
                        isSender: false,
                        isRead: true,
                    },
                    {
                        text: 'Yes, it is! Would you like to come by and check it out?',
                        time: '10:32 AM',
                        isSender: true,
                        isRead: true,
                    },
                ],
                isUnread: false,
                unreadCount: 0,
                productInfo: 'Vintage Table Lamp',
            },
            {
                id: '2',
                name: 'Sahan',
                time: '10:35 AM',
                message: [
                    {
                        text: 'I want to buy some wheat.',
                        time: '10:35 AM',
                        isSender: false,
                        isRead: true,
                    },
                    {
                        text: 'Sure, I have some available. What quantity are you looking for?',
                        time: '10:36 AM',
                        isSender: true,
                        isRead: true,
                    },
                ],
                isUnread: false,
                unreadCount: 0,
                productInfo: 'Wheat',
            },
            {
                id: '3',
                name: 'Alice Smith',
                time: '11:00 AM',
                message: [
                    {
                        text: 'How much is the vintage chair?',
                        time: '11:00 AM',
                        isSender: false,
                        isRead: false,
                    },
                ],
                isUnread: true,
                unreadCount: 1,
                productInfo: 'Vintage Chair',
            },
            {
                id: '4',
                name: 'Robert Brown',
                time: '11:15 AM',
                message: [
                    {
                        text: 'Is the bike still available?',
                        time: '11:15 AM',
                        isSender: false,
                        isRead: false,
                    },
                    {
                        text: 'Yes, it’s available. Would you like to buy it?',
                        time: '11:16 AM',
                        isSender: true,
                        isRead: false,
                    },
                ],
                isUnread: true,
                unreadCount: 2,
                productInfo: 'Mountain Bike',
            },
        ];

        setConversations(mockConversations);

        const totalUnreadCount = mockConversations.reduce(
            (acc, conv) => acc + (conv.isUnread ? 1 : 0),
            0
        );
        setUnreadCount(totalUnreadCount);
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

        const updatedConversations = conversations.map(conv => {
            if (conv.id === selectedConversationId) {
                const newMessage: Message = {
                    text: messageText,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isSender: false, 
                    isRead: true,  
                };

                const updatedMessages = [...conv.message, newMessage];

                return {
                    ...conv,
                    message: updatedMessages,
                    isUnread: true,  // Mark the conversation as having unread messages
                    unreadCount: conv.unreadCount + 1,  // Increment the unread count
                };
            }
            return conv;
        });

        setConversations(updatedConversations);

        const totalUnreadCount = updatedConversations.reduce(
            (acc, conv) => acc + conv.unreadCount,
            0
        );
        setUnreadCount(totalUnreadCount);
    };

    const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

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
                {selectedConversation && (
                    <InboxConversation
                        name={selectedConversation.name}
                        productName={selectedConversation.productInfo || ''}
                        messages={selectedConversation.message}
                        onSendMessage={handleSendMessage}  // Pass handleSendMessage as a prop
                    />
                )}
            </div>
        </div>
    );
};

export default BuyerInbox;
