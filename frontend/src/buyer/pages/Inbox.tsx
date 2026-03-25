import React, { useState, useEffect, useCallback, useRef } from 'react';
import InboxSidebar from '../../components/InboxSidebar';
import InboxConversation from '../../components/InboxConversation';
import { ConversationProps, Message } from '../../types/inboxTypes';
import { SearchHeaderLight } from '../../components/Header';
import { getConversation, getMessages, markMessagesAsRead, getCurrentCompanyId } from '../../services/inbox.service';
import { useLocation } from 'react-router-dom';
import { socketService } from '../../services/socket.service';
import { useNotifications } from '../../contexts/NotificationContext';

const BuyerInbox = () => {
    const [conversations, setConversations] = useState<ConversationProps[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [selectedConversation, setSelectedConversation] = useState<ConversationProps | null>(null);
    const [currentCompanyId, setCurrentCompanyId] = useState<string>('');
    const [isTyping, setIsTyping] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(384);
    const location = useLocation();
    const { refreshUnreadMessageCount, refreshUnreadCounts } = useNotifications();
    
    // Store latest state in refs for socket callbacks
    const currentCompanyIdRef = useRef(currentCompanyId);
    const selectedConversationIdRef = useRef(selectedConversationId);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizingRef = useRef(false);

    useEffect(() => {
        currentCompanyIdRef.current = currentCompanyId;
    }, [currentCompanyId]);

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

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            const response = await getConversation('');
            if (response.status === 'success') {
                const convs = response.data.map((conv: any, idx: number) => {
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
                const activeId = selectedConversationIdRef.current;
                const normalized = convs.map((conv: any) => (
                    conv.id === activeId ? { ...conv, unreadCount: 0 } : conv
                ));
                setConversations(normalized);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, [currentCompanyId]);

    useEffect(() => {
        setUnreadCount(conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0));
    }, [conversations]);

    useEffect(() => {
        if (currentCompanyId) {
            fetchConversations();
        }
    }, [fetchConversations, currentCompanyId]);

    useEffect(() => {
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

    const getId = (val: any) => typeof val === 'string' ? val : val?._id;

    // Socket setup
    useEffect(() => {
        // Connect to socket when company ID is available
        if (currentCompanyId) {
            socketService.connect();
        }

        const handleMessageReceived = (data: { conversationId: string; message: Message }) => {
            const senderId = getId(data.message.sender);
            // Note: Toast notifications are now handled by NotificationContext for better consistency

            // If message belongs to current conversation
            if (data.conversationId === selectedConversationIdRef.current) {
                setMessages(prev => {
                    // 1. Check if we already have this exact message (by REAL ID)
                    if (prev.some(m => getId(m._id) === getId(data.message._id))) return prev;

                    // 2. If it's from ME, check if we have a matching optimistic message
                    //    (Same text, same sender, and ID looks temporary)
                    if (getId(data.message.sender) === currentCompanyIdRef.current) {
                        const optimisticMatchIndex = prev.findIndex(m => 
                            m.text === data.message.text && 
                            getId(m.sender) === currentCompanyIdRef.current &&
                            m._id.includes('.') // Math.random() produces "0.xxxx"
                        );

                        if (optimisticMatchIndex !== -1) {
                            // Replace optimistic message with real one
                            const newMessages = [...prev];
                            newMessages[optimisticMatchIndex] = {
                                ...data.message,
                                isSender: true
                            };
                            return newMessages;
                        }
                    }

                    // 3. Otherwise/Standard case: Add new message
                    const incomingMessage = {
                        ...data.message,
                        isSender: getId(data.message.sender) === currentCompanyIdRef.current,
                        readBy: data.message.readBy || [],
                        reactions: data.message.reactions || [],
                    };
                    if (senderId && senderId !== currentCompanyIdRef.current) {
                        incomingMessage.readBy = [...incomingMessage.readBy, currentCompanyIdRef.current]
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

                // Mark as read immediately if viewing
                if (currentCompanyIdRef.current && getId(data.message.sender) !== currentCompanyIdRef.current) {
                    socketService.markAsRead(data.conversationId, currentCompanyIdRef.current);
                }
            }
            // Always refresh conversations to update sidebar (lastMessage, unread counts for other conversations)
            fetchConversations();
        };

        const handleMessageUpdated = (data: { conversationId: string; message: Message }) => {
            if (data.conversationId === selectedConversationIdRef.current) {
                setMessages(prev => {
                    const nextMessages = prev.map(msg => (
                        getId(msg._id) === getId(data.message._id)
                            ? {
                                ...data.message,
                                isSender: getId(data.message.sender) === currentCompanyIdRef.current,
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

        const handleTyping = (data: { conversationId: string; companyId: string; isTyping: boolean }) => {
            if (data.conversationId !== selectedConversationIdRef.current) {
                return;
            }
            if (data.companyId === currentCompanyIdRef.current) {
                return;
            }
            setIsTyping(data.isTyping);
            if (data.isTyping) {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                }, 3000);
            }
        };

        socketService.onMessageReceived(handleMessageReceived);
        socketService.onTyping(handleTyping);
        socketService.onMessageUpdated(handleMessageUpdated);

        return () => {
            socketService.offMessageReceived(handleMessageReceived);
            socketService.offTyping(handleTyping);
            socketService.offMessageUpdated(handleMessageUpdated);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            // Don't disconnect here as we might switch pages but keep socket?  
            // Usually fine to keep connected, but cleaner to disconnect on unmount of app.
            // For page component, maybe leave connected.
        };
    }, [currentCompanyId, fetchConversations]);

    // Handle conversation selection & message fetching
    useEffect(() => {
        const fetchMsgs = async () => {
            if (!selectedConversationId || !currentCompanyId) return;
            
            // Join the conversation room
            socketService.joinConversation(selectedConversationId, currentCompanyId);

            const response = await getMessages(selectedConversationId);
            if (response.status === 'success') {
                setMessages(response.data.map((msg: any) => ({
                    ...msg,
                    isSender: getId(msg.sender) === currentCompanyId,
                })));
                await markMessagesAsRead(selectedConversationId);
                // Refresh both message count and total notification count
                // Await these to ensure counts are updated before continuing
                await Promise.all([
                    refreshUnreadMessageCount(),
                    refreshUnreadCounts()
                ]);
            }
        };

        if (selectedConversationId && currentCompanyId) {
            fetchMsgs();
        }

        return () => {
            if (selectedConversationId) {
                socketService.leaveConversation(selectedConversationId);
            }
        };
        setIsTyping(false);
    }, [selectedConversationId, currentCompanyId, refreshUnreadMessageCount, refreshUnreadCounts]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

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

    const handleSendMessage = async (messageText: string, replyToId?: string | null) => {
        if (!selectedConversationId || !selectedConversation || !currentCompanyId) return;

        const receiverId = selectedConversation.companyIds.find(id => id !== currentCompanyId) || '';
        const replyTarget = replyToId
            ? messages.find(msg => getId(msg._id) === replyToId)
            : null;
        const replyTo = replyTarget ? {
            _id: getId(replyTarget._id),
            text: replyTarget.text,
            sender: replyTarget.sender,
            createdAt: replyTarget.createdAt,
        } : null;

        // Optimistic UI update
        const tempId = Math.random().toString();
        const newMsg: Message = {
            _id: tempId,
            text: messageText,
            sender: currentCompanyId,
            receiver: receiverId,
            createdAt: new Date().toISOString(),
            readBy: [currentCompanyId],
            isSender: true,
            reactions: [],
            editedAt: null,
            replyTo,
        };
        setMessages(prev => [...prev, newMsg]);
        setConversations(prev => prev.map(conv => (
            conv.id === selectedConversationId
                ? { ...conv, lastMessage: messageText, lastMessageTime: newMsg.createdAt, unreadCount: 0 }
                : conv
        )));

        if (!socketService.isConnected()) {
            console.error('Inbox socket is not connected; message not sent.');
            setMessages(prev => prev.filter(m => m._id !== tempId));
            return;
        }

        socketService.sendMessage(selectedConversationId, currentCompanyId, messageText, replyToId || null);
        fetchConversations(); // Update last message in sidebar
    };

    const handleReactMessage = (messageId: string, emoji: string) => {
        if (!selectedConversationId || !currentCompanyId) return;
        socketService.toggleReaction(selectedConversationId, currentCompanyId, messageId, emoji);
    };

    const handleEditMessage = (messageId: string, text: string) => {
        if (!selectedConversationId || !currentCompanyId) return;
        socketService.editMessage(selectedConversationId, currentCompanyId, messageId, text);
    };

    const handleTyping = (typing: boolean) => {
        if (selectedConversationId && currentCompanyId) {
            socketService.emitTyping(selectedConversationId, currentCompanyId, typing);
        }
    };

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
                    currentCompanyId={currentCompanyId}
                    width={sidebarWidth}
                    onResizeStart={handleResizeStart}
                />
                {selectedConversation && (
                    <InboxConversation
                        name={selectedConversation.companyName}
                        productName={selectedConversation.productName}
                        companyId={selectedConversation.companyIds?.find(id => id !== currentCompanyId)}
                        profilePicture={selectedConversation.profilePicture}
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

export default BuyerInbox;
