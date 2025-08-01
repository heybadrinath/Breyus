import React, { useState, useEffect, useCallback } from 'react';
import InboxSidebar from '../../components/InboxSidebar';
import InboxConversation from '../../components/InboxConversation';
import { ConversationProps, Message } from '../../types/inboxTypes';
import { SearchHeaderLight } from '../../components/Header';
import { getConversation, getMessages, sendMessage, markMessagesAsRead, getCurrentCompanyId } from '../../services/inbox.service';
import { useLocation } from 'react-router-dom';

const BuyerInbox = () => {
    const [conversations, setConversations] = useState<ConversationProps[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [selectedConversation, setSelectedConversation] = useState<ConversationProps | null>(null);
    const [currentCompanyId, setCurrentCompanyId] = useState<string>('');
    const location = useLocation();

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            const response = await getConversation('');
            if (response.status === 'success') {
                // Add id field if missing, reconstruct companyIds if possible
                const convs = response.data.map((conv: any, idx: number) => {
                    // Find the other participant's name
                    let companyName = conv.companyName;
                    if (conv.companyIds && conv.participantNames && currentCompanyId) {
                        const idxOther = conv.companyIds.findIndex((id: string) => id !== currentCompanyId);
                        if (idxOther !== -1) companyName = conv.participantNames[idxOther];
                    }
                    return {
                        ...conv,
                        id: conv._id || conv.id || idx.toString(),
                        companyIds: conv.companyIds || [],
                        companyName,
                    };
                });
                setConversations(convs);
                setUnreadCount(convs.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0));
            } else {
                console.error('Failed to fetch conversations:', response.message);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, [currentCompanyId]);

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

    // Select conversation from URL if present
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlConversationId = params.get('conversationId');
        if (urlConversationId && conversations.length > 0) {
            const conv = conversations.find(c => c.id === urlConversationId);
            if (conv) {
                setSelectedConversation(conv);
                setSelectedConversationId(conv.id);
            }
        }
    }, [location.search, conversations]);

    // Helper to get string ID from sender (string or object)
    const getId = (val: any) => typeof val === 'string' ? val : val?._id;

    // Fetch messages for selected conversation
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
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
            interval = setInterval(fetchMsgs, 4000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
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
