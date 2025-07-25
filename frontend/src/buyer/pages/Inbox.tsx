import React, { useState, useEffect, useCallback } from 'react';

import InboxSidebar from '../../components/InboxSidebar';
import InboxConversation from '../../components/InboxConversation';
import { ConversationProps, Message } from '../../types/inboxTypes';
import { SearchHeaderLight } from '../../components/Header';
import { getConversation, getMessages, sendMessage, markMessagesAsRead } from '../../services/inbox.service';

const BuyerInbox = () => {
    const [conversations, setConversations] = useState<ConversationProps[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [currentCompanyId, setCurrentCompanyId] = useState<string>('');
    const [selectedConversation, setSelectedConversation] = useState<ConversationProps | null>(null);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            const response = await getConversation('');
            if (response.status === 'success') {
                // Add id field if missing
                const convs = response.data.map((conv: any, idx: number) => ({
                    ...conv,
                    id: conv._id || conv.id || idx.toString(),
                }));
                setConversations(convs);
                // Calculate total unread
                setUnreadCount(convs.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0));
            } else {
                console.error('Failed to fetch conversations:', response.message);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Fetch messages for selected conversation
    useEffect(() => {
        const fetchMsgs = async () => {
            if (!selectedConversationId) return;
            const response = await getMessages(selectedConversationId);
            if (response.status === 'success') {
                // Get current companyId from first message or conversation
                let companyId = currentCompanyId;
                if (!companyId && response.data.length > 0) {
                    // Try to infer from sender/receiver
                    // (In real app, get from auth context)
                    companyId = response.data[0].sender;
                    setCurrentCompanyId(companyId);
                }
                // Mark as read
                await markMessagesAsRead(selectedConversationId);
                // Set messages with isSender for alignment
                setMessages(response.data.map((msg: any) => ({
                    ...msg,
                    isSender: msg.sender === companyId,
                })));
                // Update selected conversation info
                const conv = conversations.find(c => c.id === selectedConversationId) || null;
                setSelectedConversation(conv);
                // Refresh conversations to update unread
                fetchConversations();
            }
        };
        fetchMsgs();
        // eslint-disable-next-line
    }, [selectedConversationId]);

    // Set currentCompanyId when a conversation is selected
    useEffect(() => {
        if (!selectedConversationId) return;
        // For now, set a fixed companyId for debugging
        let companyId: string = currentCompanyId || '';
        if (!companyId && messages.length > 0) {
            // Fallback: try to infer from messages
            companyId = messages.find(m => m.isSender)?.sender || '';
        }
        if (!companyId) {
            // As a last resort, prompt (for debugging)
            companyId = window.prompt('Enter your companyId for debugging:') || '';
        }
        setCurrentCompanyId(companyId);
    }, [selectedConversationId]);

    // Handle search input
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    // Handle conversation selection
    const handleConversationSelect = (conversationId: string) => {
        setSelectedConversationId(conversationId);
    };

    // Handle sending a message in the selected conversation
    const handleSendMessage = async (messageText: string) => {
        console.log("Parent received message in BuyerInbox:", messageText);
        if (!selectedConversationId || !currentCompanyId) return;
        // Optimistically append
        const newMsg: Message = {
            _id: Math.random().toString(),
            text: messageText,
            sender: currentCompanyId,
            receiver: '', // will be set by backend
            createdAt: new Date().toISOString(),
            readBy: [currentCompanyId],
            isSender: true,
        };
        setMessages(prev => [...prev, newMsg]);
        // Send to backend
        const response = await sendMessage(selectedConversationId, messageText);
        if (response.status === 'success') {
            // Replace optimistic message with real one
            setMessages(prev => prev.map(m => m._id === newMsg._id ? { ...response.data, isSender: true } : m));
            fetchConversations();
        } else {
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m._id !== newMsg._id));
        }
    };

    return (
        <div className='h-screen flex flex-col'>
            <SearchHeaderLight />
            <div className="flex h-full bg-gray-50 font-sans">
                <InboxSidebar
                    conversations={conversations}
                    unreadCount={unreadCount}
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    onConversationSelect={handleConversationSelect}
                />
                {selectedConversation && (
                    <InboxConversation
                        name={selectedConversation.companyName}
                        productName={selectedConversation.productName}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                    />
                )}
            </div>
        </div>
    );
};

export default BuyerInbox;
