import { io, Socket } from 'socket.io-client';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  messages: Message[];
}

class ChatService {
  private socket: Socket | null = null;
  private userId: string = '';

  // Initialize socket connection
  connect(userId: string) {
    if (this.socket) {
      this.disconnect();
    }

    this.userId = userId;
    this.socket = io('http://localhost:5000');

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.register(userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return this.socket;
  }

  // Register the user with their ID
  register(userId: string) {
    if (!this.socket) return;
    this.socket.emit('register', userId);
  }

  // Join a chat room with another user
  joinRoom(otherUserId: string): Promise<{ roomId: string; messages: Message[] }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject('Socket not connected');
        return;
      }

      this.socket.emit(
        'joinRoom',
        { userId: this.userId, otherUserId },
        (response: any) => {
          if (response.status === 'joined') {
            resolve({
              roomId: response.roomId,
              messages: response.messages,
            });
          } else {
            reject('Failed to join room');
          }
        }
      );
    });
  }

  // Send a message in a chat room
  sendMessage(roomId: string, receiverId: string, content: string): Promise<Message> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject('Socket not connected');
        return;
      }

      this.socket.emit(
        'sendMessage',
        {
          roomId,
          senderId: this.userId,
          receiverId,
          content,
        },
        (response: any) => {
          if (response.status === 'sent') {
            resolve(response.message);
          } else {
            reject('Failed to send message');
          }
        }
      );
    });
  }

  // Listen for new messages
  onNewMessage(callback: (message: Message) => void) {
    if (!this.socket) return;
    this.socket.on('newMessage', callback);
  }

  // Get user's chat rooms
  getChatRooms(): Promise<ChatRoom[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject('Socket not connected');
        return;
      }

      this.socket.emit('getRooms', this.userId, (rooms: ChatRoom[]) => {
        resolve(rooms);
      });
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new ChatService(); 