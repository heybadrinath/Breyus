export interface Message {
  text: string;    
  time: string;      
  isSender: boolean;  
  isRead?: boolean;   
}

export interface ConversationProps {
  id: string;          
  name: string;       
  time: string;          
  message: Message[];   
  isUnread: boolean;    
  unreadCount: number;  
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
