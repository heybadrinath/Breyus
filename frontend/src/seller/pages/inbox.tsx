import React, { useState, useEffect, useCallback, useRef } from 'react';
import InboxSidebar from '../../components/InboxSidebar';
import InboxConversation from '../../components/InboxConversation';
import { ConversationProps, Message } from '../../types/inboxTypes';
import { SearchHeaderLight } from '../../components/Header';
import { getConversation, getMessages, markMessagesAsRead, getCurrentCompanyId } from '../../services/inbox.service';
import socketService from '../../services/socket.service';
import { useNotifications } from '../../contexts/NotificationContext';

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
    const [sidebarWidth, setSidebarWidth] = useState(384);
    const previousConversationId = useRef<string | null>(null);
    const { refreshUnreadMessageCount, refreshUnreadCounts } = useNotifications();
    const selectedConversationIdRef = useRef<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizingRef = useRef(false);

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
                const activeId = selectedConversationIdRef.current;
                const normalized = convs.map((conv: any) => (
                    conv.id === activeId ? { ...conv, unreadCount: 0 } : conv
                ));
                setConversations(normalized);
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
        selectedConversationIdRef.current = selectedConversationId;
    }, [selectedConversationId]);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (!isResizingRef.current) return;
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const containerWidth = rect.width;
            const minWidth = 220;
            const maxWidth = Math.min(520, Math.max(minWidth, containerWidth - 360));
            const nextWidth = Math.min(maxWidth, Math.max(minWidth, event.clientX - rect.left));
            setSidebarWidth(nextWidth);
        };

        const handleMouseUp = () => {
            if (!isResizingRef.current) return;
            isResizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useEffect(() => {
        if (selectedConversationId) {
            setConversations(prev => prev.map(conv => (
                conv.id === selectedConversationId ? { ...conv, unreadCount: 0 } : conv
            )));
        }
    }, [selectedConversationId]);

    useEffect(() => {
        setUnreadCount(conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0));
    }, [conversations]);

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
        // Note: Toast notifications are now handled by NotificationContext for better consistency
        const handleMessageReceived = (data: { conversationId: string; message: any }) => {
            const senderId = getId(data.message.sender);

            if (data.conversationId === selectedConversationIdRef.current) {
                setMessages(prev => {
                    // Check if message already exists
                    const exists = prev.some(m => m._id === data.message._id);
                    if (exists) return prev;
                    const incomingMessage = {
                        ...data.message,
                        isSender: getId(data.message.sender) === currentCompanyId,
                        readBy: data.message.readBy || [],
                        reactions: data.message.reactions || [],
                    };
                    if (senderId && senderId !== currentCompanyId) {
                        incomingMessage.readBy = [...incomingMessage.readBy, currentCompanyId]
                            .filter((item, index, arr) => arr.indexOf(item) === index);
                    }
                    const nextMessages = [...prev, incomingMessage];
                    const lastMessage = nextMessages[nextMessages.length - 1];
                    setConversations(prevConvs => prevConvs.map(conv => (
                        conv.id === data.conversationId
                            ? { ...conv, lastMessage: lastMessage.text, lastMessageTime: lastMessage.createdAt, unreadCount: 0 }
                            : conv
                    )));
                    return nextMessages;
                });
            }
            // Update conversation list
            fetchConversations();
        };

        const handleMessageUpdated = (data: { conversationId: string; message: any }) => {
            if (data.conversationId === selectedConversationId) {
                setMessages(prev => {
                    const nextMessages = prev.map(msg => (
                        getId(msg._id) === getId(data.message._id)
                            ? {
                                ...data.message,
                                isSender: getId(data.message.sender) === currentCompanyId,
                            }
                            : msg
                    ));
                    const lastMessage = nextMessages[nextMessages.length - 1];
                    if (lastMessage) {
                        setConversations(prevConvs => prevConvs.map(conv => (
                            conv.id === data.conversationId
                                ? { ...conv, lastMessage: lastMessage.text, lastMessageTime: lastMessage.createdAt }
                                : conv
                        )));
                    }
                    return nextMessages;
                });
            } else {
                fetchConversations();
            }
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
        socketService.onMessageUpdated(handleMessageUpdated);

        return () => {
            socketService.offMessageReceived(handleMessageReceived);
            socketService.offMessagesRead(handleMessagesRead);
            socketService.offTyping(handleTyping);
            socketService.offMessageUpdated(handleMessageUpdated);
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
                // Refresh both message count and total notification count
                // Await these to ensure counts are updated before continuing
                await Promise.all([
                    refreshUnreadMessageCount(),
                    refreshUnreadCounts()
                ]);
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
    }, [selectedConversationId, currentCompanyId, refreshUnreadMessageCount, refreshUnreadCounts]);

    // Handle search input
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    // Handle conversation selection
    const handleConversationSelect = (conversation: ConversationProps) => {
        setSelectedConversation(conversation);
        setSelectedConversationId(conversation.id);
        setConversations(prev => prev.map(conv => (
            conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
        )));
    };

    const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    // Handle sending a message in the selected conversation
    const handleSendMessage = async (messageText: string, replyToId?: string | null) => {
        if (!selectedConversationId || !selectedConversation || !currentCompanyId) return;

        // Stop typing indicator when sending
        socketService.emitTyping(selectedConversationId, currentCompanyId, false);

        if (!socketService.isConnected()) {
            console.error('Inbox socket is not connected; message not sent.');
            return;
        }

        // Send via WebSocket only
        socketService.sendMessage(selectedConversationId, currentCompanyId, messageText, replyToId || null);
    };

    const handleReactMessage = (messageId: string, emoji: string) => {
        if (!selectedConversationId || !currentCompanyId) return;
        socketService.toggleReaction(selectedConversationId, currentCompanyId, messageId, emoji);
    };

    const handleEditMessage = (messageId: string, text: string) => {
        if (!selectedConversationId || !currentCompanyId) return;
        socketService.editMessage(selectedConversationId, currentCompanyId, messageId, text);
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
        <div className='h-screen flex flex-col overflow-hidden'>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                <SearchHeaderLight />
            </div>
            <div ref={containerRef} className="flex flex-1 min-h-0 bg-gray-50 font-sans overflow-hidden">
                <InboxSidebar
                    conversations={conversations}
                    unreadCount={unreadCount}
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    onConversationSelect={handleConversationSelect}
                    width={sidebarWidth}
                    onResizeStart={handleResizeStart}
                />
                {selectedConversation && (
                    <InboxConversation
                        name={selectedConversation.companyName}
                        productName={selectedConversation.productName}
                        messages={messages}
                        currentCompanyId={currentCompanyId}
                        onSendMessage={handleSendMessage}
                        onReactMessage={handleReactMessage}
                        onEditMessage={handleEditMessage}
                        isTyping={isTyping}
                        onTyping={handleTyping}
                    />
                )}
            </div>
        </div>
    );
};

export default SellerInbox;
