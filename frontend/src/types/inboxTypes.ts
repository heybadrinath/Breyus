// Message Interface
export interface Message {
  _id: string;            // Unique ID for each message
  text: string;           // The content of the message
  sender: string;         // Sender's company ID
  receiver: string;       // Receiver's company ID
  createdAt: string;      // Timestamp for when the message was created
  readBy: string[];       // List of company IDs who have read the message
  isSender?: boolean;     // For frontend alignment (true if the current user sent the message)
}

// Conversation Interface
export interface ConversationProps {
  id: string;              // Unique ID for the conversation
  productName: string;     // Name of the product involved in the conversation
  companyIds: string[];    // An array of company IDs [senderCompanyId, receiverCompanyId]
  companyName: string;     // Name of the company involved in the conversation
  unreadCount: number;     // Number of unread messages in the conversation
  lastMessageTime: string; // Timestamp of the last message sent in the conversation
  lastMessage: string;     // The content of the last message sent in the conversation
  productInfo?: string;    // Optional additional info about the product or conversation
}

// Inbox Sidebar Props Interface
export interface InboxSidebarProps {
  conversations: ConversationProps[];   // List of conversations to be displayed in the sidebar
  unreadCount: number;                  // Total number of unread messages across all conversations
  searchQuery: string;                  // Current search query for filtering conversations
  handleSearch: (query: string) => void; // Function to handle search input changes
  onConversationSelect: (conversation: ConversationProps) => void; // Function to handle conversation selection
}

// Inbox Conversation Props Interface
export interface InboxConversationProps {
  name: string;            // Name of the company involved in the conversation
  productName: string;     // Name of the product involved in the conversation
  messages: Message[];     // List of messages in the conversation
  onSendMessage: (messageText: string) => void; // Function to send a message
  onAttachFile?: () => void; // Optional function to handle file attachments
  isTyping?: boolean;      // Whether the other user is typing
  onTyping?: (isTyping: boolean) => void; // Function to emit typing indicator
}
