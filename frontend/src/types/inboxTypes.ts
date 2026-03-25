// Message Interface
export interface MessageReaction {
  emoji: string;
  user: string | { _id: string; companyName?: string };
  reactedAt?: string;
}

export interface MessageReference {
  _id: string;
  text: string;
  sender: string | { _id: string; companyName?: string };
  createdAt?: string | null;
}

export interface Message {
  _id: string;            // Unique ID for each message
  text: string;           // The content of the message
  sender: string | { _id: string; companyName?: string };
  receiver: string | { _id: string; companyName?: string };
  createdAt: string;      // Timestamp for when the message was created
  editedAt?: string | null;
  readBy: string[];       // List of company IDs who have read the message
  reactions?: MessageReaction[];
  replyTo?: MessageReference | null;
  isSender?: boolean;     // For frontend alignment (true if the current user sent the message)
}

// Conversation Interface
export interface ConversationProps {
  id: string;              // Unique ID for the conversation
  productName: string;     // Name of the product involved in the conversation
  companyIds: string[];    // An array of company IDs [senderCompanyId, receiverCompanyId]
  companyName: string;     // Name of the company involved in the conversation
  profilePicture?: string | null; // Profile picture URL of the other participant
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
  currentCompanyId?: string;            // Current user's company ID for determining other participant
  width?: number;
  onResizeStart?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

// Inbox Conversation Props Interface
export interface InboxConversationProps {
  name: string;            // Name of the company involved in the conversation
  productName: string;     // Name of the product involved in the conversation
  companyId?: string | null; // ID of the other company (for navigation to profile)
  profilePicture?: string | null; // Profile picture URL of the other company
  messages: Message[];     // List of messages in the conversation
  currentCompanyId: string;
  onSendMessage: (messageText: string, replyToId?: string | null) => void; // Function to send a message
  onReactMessage: (messageId: string, emoji: string) => void;
  onEditMessage: (messageId: string, text: string) => void;
  isTyping?: boolean;      // Whether the other user is typing
  onTyping?: (isTyping: boolean) => void; // Function to emit typing indicator
}
