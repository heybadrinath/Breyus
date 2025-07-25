export interface Message {
  text: string;    
  time: string;      
  isSender: boolean;  
  isRead?: boolean;   
}

export interface ConversationProps {
  productName: string;
  companyName: string;
  unreadCount: number;
  lastMessageTime: string;
  lastMessage: string;
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
