import { Injectable } from '@nestjs/common';

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

@Injectable()
export class MessagesService {
  private chatRooms: Map<string, ChatRoom> = new Map();

  getChatRoomById(roomId: string): ChatRoom | undefined {
    return this.chatRooms.get(roomId);
  }

  getChatRoomByParticipants(participant1: string, participant2: string): ChatRoom | undefined {
    for (const room of this.chatRooms.values()) {
      if (
        room.participants.includes(participant1) &&
        room.participants.includes(participant2)
      ) {
        return room;
      }
    }
    return undefined;
  }

  createChatRoom(participant1: string, participant2: string): ChatRoom {
    const roomId = `${participant1}_${participant2}`;
    const newRoom: ChatRoom = {
      id: roomId,
      participants: [participant1, participant2],
      messages: [],
    };
    this.chatRooms.set(roomId, newRoom);
    return newRoom;
  }

  addMessage(roomId: string, message: Message): Message {
    const room = this.getChatRoomById(roomId);
    if (room) {
      room.messages.push(message);
      return message;
    }
    throw new Error('Chat room not found');
  }

  getMessages(roomId: string): Message[] {
    const room = this.getChatRoomById(roomId);
    return room ? room.messages : [];
  }

  getUserChatRooms(userId: string): ChatRoom[] {
    const userRooms: ChatRoom[] = [];
    for (const room of this.chatRooms.values()) {
      if (room.participants.includes(userId)) {
        userRooms.push(room);
      }
    }
    return userRooms;
  }
} 