import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import authService from '../services/auth.service';

// Define interfaces for our messaging data
interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
}

interface ChatRoom {
  id: string;
  participants: string[];
  messages: Message[];
}

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
}

const Inbox: React.FC = () => {
  // Socket connection
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // UI States
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Initialize socket connection and load user data
  useEffect(() => {
    // Get current user
    const user = authService.getUser();
    setCurrentUser(user);

    // Set a timeout to ensure loading state doesn't persist indefinitely
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    try {
      // Connect to WebSocket server
      const socketInstance = io('http://localhost:3000', {
        timeout: 5000,
        reconnectionAttempts: 3
      }); // Update with your backend URL
      setSocket(socketInstance);

      // Set up socket event listeners
      socketInstance.on('connect', () => {
        console.log('Connected to WebSocket server');
        if (user) {
          socketInstance.emit('register', user.id);
          fetchContacts(user.id);
        }
      });

      socketInstance.on('connect_error', () => {
        console.log('Connection error - could not connect to WebSocket server');
        setIsLoading(false);
        clearTimeout(loadingTimeout);
        
        // Set empty contacts list if connection fails
        setContacts([]);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      // Cleanup
      return () => {
        socketInstance.disconnect();
        clearTimeout(loadingTimeout);
      };
    } catch (error) {
      console.error('Error connecting to socket:', error);
      setIsLoading(false);
      clearTimeout(loadingTimeout);
      setContacts([]);
    }
  }, []);

  // Set up message listener when socket or current room changes
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages(prevMessages => [...prevMessages, message]);
      
      // Update the contact's last message
      setContacts(prevContacts => {
        return prevContacts.map(contact => {
          if (
            contact.id === message.senderId || 
            contact.id === message.receiverId
          ) {
            return {
              ...contact,
              lastMessage: message.content,
              lastMessageTime: message.timestamp,
              unreadCount: selectedContact?.id === contact.id 
                ? 0 
                : (contact.unreadCount || 0) + 1,
            };
          }
          return contact;
        });
      });
    };

    socket.on('newMessage', handleNewMessage);

    // Cleanup
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, selectedContact]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch contacts for the current user
  const fetchContacts = async (userId: string) => {
    try {
      // In a real app, you would fetch contacts from your API
      // For now, we'll just use the socket
      if (socket && socket.connected) {
        socket.emit('getRooms', userId, (rooms: ChatRoom[]) => {
          // Extract other participants as contacts
          const contactsFromRooms = rooms.map(room => {
            const otherParticipantId = room.participants.find(p => p !== userId) || '';
            // In a real app, you would fetch user details from your API
            return {
              id: otherParticipantId,
              name: `User ${otherParticipantId.substring(0, 5)}`, // Placeholder
              lastMessage: room.messages.length > 0 
                ? room.messages[room.messages.length - 1].content 
                : '',
              lastMessageTime: room.messages.length > 0 
                ? room.messages[room.messages.length - 1].timestamp 
                : new Date(),
              unreadCount: 0
            };
          });
          
          // Add some sample contacts if no rooms exist yet
          if (contactsFromRooms.length === 0) {
            setContacts([
              { id: '1', name: 'Seller 1', unreadCount: 0 },
              { id: '2', name: 'Buyer 1', unreadCount: 0 },
              { id: '3', name: 'Support Team', unreadCount: 0 },
            ]);
          } else {
            setContacts(contactsFromRooms);
          }
          setIsLoading(false);
        });
      } else {
        // If socket is not available, set empty contacts
        setContacts([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
      setIsLoading(false);
    }
  };

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    
    // Reset unread count
    setContacts(prevContacts =>
      prevContacts.map(c =>
        c.id === contact.id ? { ...c, unreadCount: 0 } : c
      )
    );
    
    if (socket && currentUser) {
      // Join room with the selected contact
      socket.emit('joinRoom', {
        userId: currentUser.id,
        otherUserId: contact.id,
      }, (response: { roomId: string; messages: Message[] }) => {
        setCurrentRoomId(response.roomId);
        setMessages(response.messages);
        // Focus on message input
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      });
    }
  };

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !socket || !currentRoomId || !currentUser || !selectedContact) {
      return;
    }
    
    const messageData = {
      roomId: currentRoomId,
      senderId: currentUser.id,
      receiverId: selectedContact.id,
      content: inputMessage,
    };
    
    socket.emit('sendMessage', messageData);
    setInputMessage('');
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='flex flex-col shadow-lg mx-auto my-12 bg-white rounded-lg overflow-hidden w-[90%] h-[80vh]'>
      {/* Header */}
      <div className='flex w-full p-4 border-b'>
        <h1 className='text-2xl font-bold'>Messages</h1>
        <div className='flex items-center ml-6'>
          <input
            type="text"
            placeholder="Search messages..."
            className='px-4 py-2 bg-[#F5F5F5] rounded-lg w-64 focus:outline-none'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main content */}
      <div className='flex h-full'>
        {/* Contacts list */}
        <div className='w-1/3 border-r overflow-y-auto'>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
            </div>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`flex p-4 border-b cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedContact?.id === contact.id ? 'bg-gray-100' : ''
                }`}
                onClick={() => handleContactSelect(contact)}
              >
                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
                  {contact.avatar ? (
                    <img src={contact.avatar} alt={contact.name} className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-lg font-semibold text-gray-700">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{contact.name}</h3>
                    {contact.lastMessageTime && (
                      <span className="text-xs text-gray-500">
                        {formatTime(contact.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 truncate w-36">
                      {contact.lastMessage || "No messages yet"}
                    </p>
                    {(contact.unreadCount ?? 0) > 0 && (
                      <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
              No contacts found
            </div>
          )}
        </div>

        {/* Message area */}
        <div className='flex-1 flex flex-col'>
          {selectedContact ? (
            <>
              {/* Selected contact header */}
              <div className="p-4 border-b flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-700">
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="ml-3 font-semibold">{selectedContact.name}</h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4" id="message-box">
                {messages.length > 0 ? (
                  messages.map((message, index) => {
                    const isCurrentUser = currentUser && message.senderId === currentUser.id;
                    
                    return (
                      <div
                        key={message.id || index}
                        className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`px-4 py-2 rounded-lg max-w-[70%] ${
                            isCurrentUser
                              ? 'bg-[#353535] text-white'
                              : 'bg-[#F0F0F0] text-black'
                          }`}
                        >
                          <div>{message.content}</div>
                          <div className={`text-xs mt-1 ${isCurrentUser ? 'text-gray-300' : 'text-gray-500'}`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Start a conversation with {selectedContact.name}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex">
                  <input
                    ref={messageInputRef}
                    type="text"
                    className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none"
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-black text-white px-6 py-2 rounded-r-lg"
                    disabled={!inputMessage.trim()}
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : contacts.length > 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              Select a contact to start messaging
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              No users yet available for messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;