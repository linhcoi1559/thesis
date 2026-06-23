import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Phương thức dùng để đẩy thông báo realtime
  sendNotificationToUser(userId: string, title: string, message: string) {
    this.server.emit(`notification-${userId}`, {
      title,
      message,
      createdAt: new Date(),
    });
  }

  sendNotificationToLandlord(landlordId: string, title: string, message: string) {
    this.server.emit(`notification-landlord-${landlordId}`, {
      title,
      message,
      createdAt: new Date(),
    });
  }
}

