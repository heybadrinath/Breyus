import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService, Message } from './messages.service';
import { v4 as uuidv4 } from 'uuid';

interface JoinRoomDto {
  userId: string;
  otherUserId: string;
}

interface SendMessageDto {
  roomId: string;
  senderId: string;
  receiverId: string;
  content: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  private userSocketMap: Map<string, string> = new Map();

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Remove user from the map when they disconnect
    for (const [userId, socketId] of this.userSocketMap.entries()) {
      if (socketId === client.id) {
        this.userSocketMap.delete(userId);
        break;
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    this.userSocketMap.set(userId, client.id);
    console.log(`User ${userId} registered with socket ${client.id}`);
    return { status: 'registered' };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto,
  ) {
    let room = this.messagesService.getChatRoomByParticipants(
      data.userId,
      data.otherUserId,
    );

    if (!room) {
      room = this.messagesService.createChatRoom(data.userId, data.otherUserId);
    }

    client.join(room.id);
    console.log(`User ${data.userId} joined room ${room.id}`);

    return {
      status: 'joined',
      roomId: room.id,
      messages: room.messages,
    };
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    const now = new Date();
    const message: Message = {
      id: uuidv4(),
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      type: 'text',
      isRead: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      timestamp: now,
    };

    const savedMessage = this.messagesService.addMessage(data.roomId, message);
    this.server.to(data.roomId).emit('newMessage', savedMessage);

    return { status: 'sent', message: savedMessage };
  }

  @SubscribeMessage('getMessages')
  handleGetMessages(
    @MessageBody() roomId: string,
  ) {
    const messages = this.messagesService.getMessages(roomId);
    return messages;
  }

  @SubscribeMessage('getRooms')
  handleGetRooms(
    @MessageBody() userId: string,
  ) {
    const rooms = this.messagesService.getUserChatRooms(userId);
    return rooms;
  }
} 