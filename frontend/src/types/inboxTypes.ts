export interface Message {
  _id: string;
  text: string;
  sender: string; // companyId
  receiver: string; // companyId
  createdAt: string;
  readBy: string[];
  isSender?: boolean; // for frontend alignment
}

export interface ConversationProps {
  id: string;
  productName: string;
  companyName: string;
  unreadCount: number;
  lastMessageTime: string;
  lastMessage: string;
  productInfo?: string;
}

export interface InboxSidebarProps {
  conversations: ConversationProps[]; 
  unreadCount: number;                 
  searchQuery: string;                
  handleSearch: (query: string) => void; 
  onConversationSelect: (conversationId: string) => void; 
}

export interface InboxConversationProps {
  name: string;           
  productName: string;    
  messages: Message[];    
  onSendMessage: (messageText: string) => void; 
  onAttachFile?: () => void; 
}
