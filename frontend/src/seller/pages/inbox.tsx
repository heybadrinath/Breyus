import React, { useState, useEffect, useCallback, useRef } from 'react';
import InboxSidebar from '../../components/InboxSidebar';
import InboxConversation from '../../components/InboxConversation';
import { ConversationProps, Message } from '../../types/inboxTypes';
import { SearchHeaderLight } from '../../components/Header';
import { getConversation, getMessages, sendMessage, markMessagesAsRead, getCurrentCompanyId } from '../../services/inbox.service';
import socketService from '../../services/socket.service';

const SellerInbox = () => {
    const [conversations, setConversations] = useState<ConversationProps[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [currentCompanyId, setCurrentCompanyId] = useState<string>('');
    const [selectedConversation, setSelectedConversation] = useState<ConversationProps | null>(null);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [typingCompanyId, setTypingCompanyId] = useState<string | null>(null);
    const previousConversationId = useRef<string | null>(null);

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
        // Fetch the current user's companyId on mount and connect socket
        const fetchCompanyId = async () => {
            const res = await getCurrentCompanyId();
            if (res.status === 'success') {
                setCurrentCompanyId(res.companyId);
            }
        };
        fetchCompanyId();

        // Connect to WebSocket
        socketService.connect();

        return () => {
            // Cleanup on unmount
            socketService.disconnect();
        };
    }, []);

    // Setup WebSocket event listeners
    useEffect(() => {
        if (!currentCompanyId) return;

        // Handle incoming messages
        const handleMessageReceived = (data: { conversationId: string; message: any }) => {
            if (data.conversationId === selectedConversationId) {
                setMessages(prev => {
                    // Check if message already exists
                    const exists = prev.some(m => m._id === data.message._id);
                    if (exists) return prev;
                    return [...prev, {
                        ...data.message,
                        isSender: getId(data.message.sender) === currentCompanyId,
                    }];
                });
            }
            // Update conversation list
            fetchConversations();
        };

        // Handle read receipts
        const handleMessagesRead = (data: { conversationId: string; companyId: string }) => {
            if (data.conversationId === selectedConversationId && data.companyId !== currentCompanyId) {
                setMessages(prev => prev.map(msg => ({
                    ...msg,
                    readBy: [...(msg.readBy || []), data.companyId],
                })));
            }
            fetchConversations();
        };

        // Handle typing indicator
        const handleTyping = (data: { conversationId: string; companyId: string; isTyping: boolean }) => {
            if (data.conversationId === selectedConversationId && data.companyId !== currentCompanyId) {
                setIsTyping(data.isTyping);
                setTypingCompanyId(data.isTyping ? data.companyId : null);
            }
        };

        socketService.onMessageReceived(handleMessageReceived);
        socketService.onMessagesRead(handleMessagesRead);
        socketService.onTyping(handleTyping);

        return () => {
            socketService.offMessageReceived(handleMessageReceived);
            socketService.offMessagesRead(handleMessagesRead);
            socketService.offTyping(handleTyping);
        };
    }, [currentCompanyId, selectedConversationId, fetchConversations]);

    // Fetch messages for selected conversation and join/leave rooms
    useEffect(() => {
        const fetchMsgs = async () => {
            if (!selectedConversationId || !currentCompanyId) return;
            const response = await getMessages(selectedConversationId);
            if (response.status === 'success') {
                await markMessagesAsRead(selectedConversationId);
                socketService.markAsRead(selectedConversationId, currentCompanyId);
                setMessages(response.data.map((msg: any) => ({
                    ...msg,
                    isSender: getId(msg.sender) === currentCompanyId,
                })));
                fetchConversations();
            }
        };

        // Leave previous conversation room
        if (previousConversationId.current && previousConversationId.current !== selectedConversationId) {
            socketService.leaveConversation(previousConversationId.current);
        }

        // Join new conversation room
        if (selectedConversationId && currentCompanyId) {
            socketService.joinConversation(selectedConversationId, currentCompanyId);
            fetchMsgs();
        }

        previousConversationId.current = selectedConversationId;

        // Reset typing indicator when changing conversations
        setIsTyping(false);
        setTypingCompanyId(null);
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

        // Stop typing indicator when sending
        socketService.emitTyping(selectedConversationId, currentCompanyId, false);

        // Send via WebSocket (real-time)
        socketService.sendMessage(selectedConversationId, currentCompanyId, messageText);

        // Also send via HTTP as fallback/backup
        const response = await sendMessage(selectedConversationId, messageText);
        if (response.status !== 'success') {
            console.error('Failed to send message via HTTP');
        }
    };

    // Handle typing indicator
    const handleTyping = (isCurrentlyTyping: boolean) => {
        if (selectedConversationId && currentCompanyId) {
            socketService.emitTyping(selectedConversationId, currentCompanyId, isCurrentlyTyping);
        }
    };

    // Helper to get string ID from sender (string or object)
    const getId = (val: any) => typeof val === 'string' ? val : val?._id;

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
                        isTyping={isTyping}
                        onTyping={handleTyping}
                    />
                )}
            </div>
        </div>
    );
};

export default SellerInbox;