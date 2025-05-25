import React, { useState, useEffect, useRef } from "react";
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft, Paperclip, Smile } from "lucide-react";
import chatService, { ChatConversation, ChatMessage } from "../../services/chat.service";
import authService from "../../services/auth.service";

const Inbox: React.FC = () => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUser = authService.getUser();

    useEffect(() => {
        loadConversations();
        loadUnreadCount();
        
        // Set up event listeners
        chatService.addEventListener('conversations-updated', handleConversationsUpdated);
        chatService.addEventListener('messages-updated', handleMessagesUpdated);
        chatService.addEventListener('message-sent', handleMessageSent);
        chatService.addEventListener('unread-count-updated', handleUnreadCountUpdated);

        return () => {
            chatService.removeEventListener('conversations-updated', handleConversationsUpdated);
            chatService.removeEventListener('messages-updated', handleMessagesUpdated);
            chatService.removeEventListener('message-sent', handleMessageSent);
            chatService.removeEventListener('unread-count-updated', handleUnreadCountUpdated);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
            markMessagesAsRead(selectedConversation.id);
        }
    }, [selectedConversation]);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const convs = await chatService.getConversations();
            setConversations(convs);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId: string) => {
        try {
            const msgs = await chatService.getMessages(conversationId);
            setMessages(msgs);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const count = await chatService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    const markMessagesAsRead = async (conversationId: string) => {
        try {
            await chatService.markMessagesAsRead(conversationId);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const handleConversationsUpdated = (convs: ChatConversation[]) => {
        setConversations(convs);
    };

    const handleMessagesUpdated = ({ conversationId, messages: msgs }: { conversationId: string; messages: ChatMessage[] }) => {
        if (selectedConversation && selectedConversation.id === conversationId) {
            setMessages(msgs);
        }
    };

    const handleMessageSent = (message: ChatMessage) => {
        if (selectedConversation && message.conversationId === selectedConversation.id) {
            setMessages(prev => [...prev, message]);
        }
        loadConversations(); // Refresh conversations to update last message
    };

    const handleUnreadCountUpdated = (count: number) => {
        setUnreadCount(count);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

        setSendingMessage(true);
        try {
            const otherUser = chatService.getOtherUser(selectedConversation);
            await chatService.sendMessage({
                conversationId: selectedConversation.id,
                receiverId: otherUser.id,
                content: newMessage.trim(),
                messageType: 'text'
            });
            setNewMessage("");
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSendingMessage(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery) return true;
        const otherUser = chatService.getOtherUser(conv);
        return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               otherUser.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
               conv.productName?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const formatMessageTime = (timestamp: string) => {
        return chatService.formatMessageTime(timestamp);
    };

    if (loading) {
        return (
            <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                height: "100vh",
                background: "#f8f9fa"
            }}>
                <div>Loading conversations...</div>
            </div>
        );
    }

    return (
        <div style={{ 
            display: "flex", 
            height: "100vh", 
            background: "#f8f9fa",
            fontFamily: "system-ui, -apple-system, sans-serif"
        }}>
            {/* Conversations Sidebar */}
            <div style={{ 
                width: "350px", 
                background: "#fff", 
                borderRight: "1px solid #e9ecef",
                display: "flex",
                flexDirection: "column"
            }}>
                {/* Header */}
                <div style={{ 
                    padding: "20px", 
                    borderBottom: "1px solid #e9ecef",
                    background: "#fff"
                }}>
                    <h2 style={{ 
                        margin: 0, 
                        fontSize: "24px", 
                        fontWeight: 600,
                        color: "#212529"
                    }}>
                        Messages
                        {unreadCount > 0 && (
                            <span style={{
                                background: "#dc3545",
                                color: "white",
                                borderRadius: "12px",
                                padding: "2px 8px",
                                fontSize: "12px",
                                marginLeft: "8px"
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </h2>
                    
                    {/* Search */}
                    <div style={{ 
                        position: "relative", 
                        marginTop: "15px" 
                    }}>
                        <Search 
                            size={18} 
                            style={{ 
                                position: "absolute", 
                                left: "12px", 
                                top: "50%", 
                                transform: "translateY(-50%)",
                                color: "#6c757d"
                            }} 
                        />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px 10px 40px",
                                border: "1px solid #dee2e6",
                                borderRadius: "20px",
                                fontSize: "14px",
                                outline: "none",
                                background: "#f8f9fa"
                            }}
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div style={{ 
                    flex: 1, 
                    overflowY: "auto" 
                }}>
                    {filteredConversations.length === 0 ? (
                        <div style={{ 
                            padding: "40px 20px", 
                            textAlign: "center", 
                            color: "#6c757d" 
                        }}>
                            {searchQuery ? "No conversations found" : "No conversations yet"}
                        </div>
                    ) : (
                        filteredConversations.map((conversation) => {
                            const otherUser = chatService.getOtherUser(conversation);
                            const isSelected = selectedConversation?.id === conversation.id;
                            
                            return (
                                <div
                                    key={conversation.id}
                                    onClick={() => setSelectedConversation(conversation)}
                                    style={{
                                        padding: "15px 20px",
                                        borderBottom: "1px solid #f1f3f4",
                                        cursor: "pointer",
                                        background: isSelected ? "#e3f2fd" : "transparent",
                                        transition: "background-color 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = "#f8f9fa";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = "transparent";
                                        }
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "50%",
                                            background: "#007bff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            fontWeight: 600,
                                            fontSize: "18px"
                                        }}>
                                            {otherUser.name.charAt(0).toUpperCase()}
                                        </div>
                                        
                                        {/* Conversation Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ 
                                                display: "flex", 
                                                justifyContent: "space-between", 
                                                alignItems: "center",
                                                marginBottom: "4px"
                                            }}>
                                                <h4 style={{ 
                                                    margin: 0, 
                                                    fontSize: "16px", 
                                                    fontWeight: 600,
                                                    color: "#212529",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {otherUser.name}
                                                </h4>
                                                <span style={{ 
                                                    fontSize: "12px", 
                                                    color: "#6c757d" 
                                                }}>
                                                    {formatMessageTime(conversation.lastMessageAt)}
                                                </span>
                                            </div>
                                            
                                            {/* Product info if trade-related */}
                                            {conversation.productName && (
                                                <div style={{ 
                                                    fontSize: "12px", 
                                                    color: "#28a745",
                                                    marginBottom: "2px"
                                                }}>
                                                    📦 {conversation.productName}
                                                </div>
                                            )}
                                            
                                            {/* Last message */}
                                            <p style={{ 
                                                margin: 0, 
                                                fontSize: "14px", 
                                                color: "#6c757d",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap"
                                            }}>
                                                {conversation.lastMessageContent || "No messages yet"}
                                            </p>
                                        </div>
                                        
                                        {/* Unread indicator */}
                                        {conversation.unreadCount && conversation.unreadCount > 0 && (
                                            <div style={{
                                                background: "#dc3545",
                                                color: "white",
                                                borderRadius: "50%",
                                                width: "20px",
                                                height: "20px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "12px",
                                                fontWeight: 600
                                            }}>
                                                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ 
                flex: 1, 
                display: "flex", 
                flexDirection: "column",
                background: "#fff"
            }}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ 
                            padding: "15px 20px", 
                            borderBottom: "1px solid #e9ecef",
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "8px",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                    className="md:hidden"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                
                                {(() => {
                                    const otherUser = chatService.getOtherUser(selectedConversation);
                                    return (
                                        <>
                                            <div style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                background: "#007bff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "white",
                                                fontWeight: 600
                                            }}>
                                                {otherUser.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 style={{ 
                                                    margin: 0, 
                                                    fontSize: "18px", 
                                                    fontWeight: 600,
                                                    color: "#212529"
                                                }}>
                                                    {otherUser.name}
                                                </h3>
                                                {selectedConversation.productName && (
                                                    <p style={{ 
                                                        margin: 0, 
                                                        fontSize: "12px", 
                                                        color: "#28a745" 
                                                    }}>
                                                        Trade: {selectedConversation.productName}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "8px",
                                    borderRadius: "50%",
                                    color: "#6c757d"
                                }}>
                                    <Phone size={20} />
                                </button>
                                <button style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "8px",
                                    borderRadius: "50%",
                                    color: "#6c757d"
                                }}>
                                    <Video size={20} />
                                </button>
                                <button style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "8px",
                                    borderRadius: "50%",
                                    color: "#6c757d"
                                }}>
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ 
                            flex: 1, 
                            overflowY: "auto", 
                            padding: "20px",
                            background: "#f8f9fa"
                        }}>
                            {messages.length === 0 ? (
                                <div style={{ 
                                    textAlign: "center", 
                                    color: "#6c757d",
                                    marginTop: "50px"
                                }}>
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                messages.map((message) => {
                                    const isOwnMessage = message.senderId === currentUser?.id;
                                    
                                    return (
                                        <div
                                            key={message.id}
                                            style={{
                                                display: "flex",
                                                justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                                                marginBottom: "15px"
                                            }}
                                        >
                                            <div style={{
                                                maxWidth: "70%",
                                                padding: "12px 16px",
                                                borderRadius: "18px",
                                                background: isOwnMessage ? "#007bff" : "#fff",
                                                color: isOwnMessage ? "white" : "#212529",
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                                position: "relative"
                                            }}>
                                                {message.messageType === 'trade_update' && (
                                                    <div style={{
                                                        fontSize: "12px",
                                                        opacity: 0.8,
                                                        marginBottom: "4px",
                                                        fontStyle: "italic"
                                                    }}>
                                                        🔄 Trade Update
                                                    </div>
                                                )}
                                                
                                                <div style={{ 
                                                    fontSize: "15px", 
                                                    lineHeight: 1.4,
                                                    wordWrap: "break-word"
                                                }}>
                                                    {message.content}
                                                </div>
                                                
                                                <div style={{
                                                    fontSize: "11px",
                                                    opacity: 0.7,
                                                    marginTop: "4px",
                                                    textAlign: "right"
                                                }}>
                                                    {formatMessageTime(message.createdAt)}
                                                    {isOwnMessage && (
                                                        <span style={{ marginLeft: "4px" }}>
                                                            {message.isRead ? "✓✓" : "✓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div style={{ 
                            padding: "15px 20px", 
                            borderTop: "1px solid #e9ecef",
                            background: "#fff"
                        }}>
                            <div style={{ 
                                display: "flex", 
                                alignItems: "flex-end", 
                                gap: "12px" 
                            }}>
                                <button style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "8px",
                                    color: "#6c757d"
                                }}>
                                    <Paperclip size={20} />
                                </button>
                                
                                <div style={{ 
                                    flex: 1, 
                                    position: "relative" 
                                }}>
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        rows={1}
                                        style={{
                                            width: "100%",
                                            padding: "12px 40px 12px 16px",
                                            border: "1px solid #dee2e6",
                                            borderRadius: "20px",
                                            fontSize: "15px",
                                            outline: "none",
                                            resize: "none",
                                            maxHeight: "120px",
                                            minHeight: "44px"
                                        }}
                                    />
                                    <button style={{
                                        position: "absolute",
                                        right: "8px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "4px",
                                        color: "#6c757d"
                                    }}>
                                        <Smile size={18} />
                                    </button>
                                </div>
                                
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || sendingMessage}
                                    style={{
                                        background: newMessage.trim() ? "#007bff" : "#dee2e6",
                                        color: newMessage.trim() ? "white" : "#6c757d",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "44px",
                                        height: "44px",
                                        cursor: newMessage.trim() ? "pointer" : "not-allowed",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "background-color 0.2s"
                                    }}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* No conversation selected */
                    <div style={{ 
                        flex: 1, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        flexDirection: "column",
                        color: "#6c757d",
                        background: "#f8f9fa"
                    }}>
                        <div style={{ 
                            fontSize: "48px", 
                            marginBottom: "20px" 
                        }}>
                            💬
                        </div>
                        <h3 style={{ 
                            fontSize: "24px", 
                            fontWeight: 600,
                            marginBottom: "8px",
                            color: "#495057"
                        }}>
                            Select a conversation
                        </h3>
                        <p style={{ 
                            fontSize: "16px",
                            textAlign: "center",
                            maxWidth: "300px"
                        }}>
                            Choose a conversation from the sidebar to start chatting with buyers and sellers.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inbox; 