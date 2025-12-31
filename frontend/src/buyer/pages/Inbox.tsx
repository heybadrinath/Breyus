import React, { useState, useEffect, useCallback, useRef } from 'react';
import InboxSidebar from '../../components/InboxSidebar';
import InboxConversation from '../../components/InboxConversation';
import { ConversationProps, Message } from '../../types/inboxTypes';
import { SearchHeaderLight } from '../../components/Header';
import { getConversation, getMessages, sendMessage, markMessagesAsRead, getCurrentCompanyId } from '../../services/inbox.service';
import { useLocation } from 'react-router-dom';
import { socketService } from '../../services/socket.service';

const BuyerInbox = () => {
    const [conversations, setConversations] = useState<ConversationProps[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [selectedConversation, setSelectedConversation] = useState<ConversationProps | null>(null);
    const [currentCompanyId, setCurrentCompanyId] = useState<string>('');
    const location = useLocation();
    
    // Store latest state in refs for socket callbacks
    const currentCompanyIdRef = useRef(currentCompanyId);
    const selectedConversationIdRef = useRef(selectedConversationId);

    useEffect(() => {
        currentCompanyIdRef.current = currentCompanyId;
    }, [currentCompanyId]);

    useEffect(() => {
        selectedConversationIdRef.current = selectedConversationId;
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
                setConversations(convs);
                setUnreadCount(convs.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0));
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, [currentCompanyId]);

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
                    return [...prev, {
                        ...data.message,
                        isSender: getId(data.message.sender) === currentCompanyIdRef.current
                    }];
                });

                // Mark as read immediately if viewing
                if (currentCompanyIdRef.current && getId(data.message.sender) !== currentCompanyIdRef.current) {
                    socketService.markAsRead(data.conversationId, currentCompanyIdRef.current);
                }
            } else {
                // If not viewing, refresh conversations to update unread count/snippet
                fetchConversations();
            }
        };

        socketService.onMessageReceived(handleMessageReceived);

        return () => {
            socketService.offMessageReceived(handleMessageReceived);
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
    }, [selectedConversationId, currentCompanyId]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleConversationSelect = (conversation: ConversationProps) => {
        setSelectedConversation(conversation);
        setSelectedConversationId(conversation.id);
    };

    const handleSendMessage = async (messageText: string) => {
        if (!selectedConversationId || !selectedConversation || !currentCompanyId) return;
        
        const receiverId = selectedConversation.companyIds.find(id => id !== currentCompanyId) || '';
        
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
        };
        setMessages(prev => [...prev, newMsg]);

        try {
            const response = await sendMessage(selectedConversationId, messageText);
            if (response.status === 'success') {
                // Update temp message with real one
                // NOTE: If socket arrived first, 'tempId' might technically be gone/replaced in state logic above, 
                // but since 'prev' here is fresh state in setter, we just need to ensure we don't duplicate.
                // However, matching by ID is safest. If ID not found, do nothing (assumed socket handled it).
                
                const realMsg = response.data;
                setMessages(prev => {
                    return prev.map(m => m._id === tempId ? { ...realMsg, isSender: true } : m);
                });
                fetchConversations(); // Update last message in sidebar
            } else {
                // Error
                setMessages(prev => prev.filter(m => m._id !== tempId));
            }
        } catch (error) {
            setMessages(prev => prev.filter(m => m._id !== tempId));
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
