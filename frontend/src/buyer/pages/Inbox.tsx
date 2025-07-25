import React, { useState, useEffect, useCallback } from 'react';
import InboxSidebar from '../../components/InboxSidebar';
import InboxConversation from '../../components/InboxConversation';
import { ConversationProps, Message } from '../../types/inboxTypes';
import { SearchHeaderLight } from '../../components/Header';
import { getConversation, getMessages, sendMessage, markMessagesAsRead, getCurrentCompanyId } from '../../services/inbox.service';

const BuyerInbox = () => {
    const [conversations, setConversations] = useState<ConversationProps[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [selectedConversation, setSelectedConversation] = useState<ConversationProps | null>(null);
    const [currentCompanyId, setCurrentCompanyId] = useState<string>('');

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            const response = await getConversation('');
            if (response.status === 'success') {
                // Add id field if missing, reconstruct companyIds if possible
                const convs = response.data.map((conv: any, idx: number) => ({
                    ...conv,
                    id: conv._id || conv.id || idx.toString(),
                    // companyIds is not returned by backend, so leave as [] for now
                    companyIds: conv.companyIds || [],
                }));
                setConversations(convs);
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

    useEffect(() => {
        // Fetch the current user's companyId on mount
        const fetchCompanyId = async () => {
            const res = await getCurrentCompanyId();
            if (res.status === 'success') {
                setCurrentCompanyId(res.companyId);
            }
        };
        fetchCompanyId();
    }, []);

    // Helper to get string ID from sender (string or object)
    const getId = (val: any) => typeof val === 'string' ? val : val?._id;

    // Fetch messages for selected conversation
    useEffect(() => {
        const fetchMsgs = async () => {
            if (!selectedConversationId || !currentCompanyId) return;
            const response = await getMessages(selectedConversationId);
            if (response.status === 'success') {
                setMessages(response.data.map((msg: any) => ({
                    ...msg,
                    isSender: getId(msg.sender) === currentCompanyId,
                })));
                await markMessagesAsRead(selectedConversationId);
            }
        };
        if (selectedConversationId && currentCompanyId) {
            fetchMsgs();
        }
        // eslint-disable-next-line
    }, [selectedConversationId, currentCompanyId]);

    // Handle search input
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    // Handle conversation selection
    const handleConversationSelect = (conversation: ConversationProps) => {
        setSelectedConversation(conversation);
        setSelectedConversationId(conversation.id);
    };

    // Handle sending a message in the selected conversation
    const handleSendMessage = async (messageText: string) => {
        if (!selectedConversationId || !selectedConversation || !currentCompanyId) return;
        // Find the other participant as receiver
        const receiverId = selectedConversation.companyIds.find(id => id !== currentCompanyId) || '';
        const newMsg: Message = {
            _id: Math.random().toString(),
            text: messageText,
            sender: currentCompanyId,
            receiver: receiverId,
            createdAt: new Date().toISOString(),
            readBy: [currentCompanyId],
            isSender: true,
        };
        setMessages(prev => [...prev, newMsg]);
        try {
            const response = await sendMessage(selectedConversationId, messageText);
            if (response.status === 'success') {
                setMessages(prev => prev.map(m => m._id === newMsg._id ? { ...response.data, isSender: true } : m));
                fetchConversations();
            } else {
                setMessages(prev => prev.filter(m => m._id !== newMsg._id));
            }
        } catch (error) {
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
