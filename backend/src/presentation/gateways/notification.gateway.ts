import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust this in production to match your frontend URL
  },
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Executed when a new WebSocket Client connects
   */
  async handleConnection(client: Socket) {
    try {
      // Extract token from either handshake auth headers or connection queries
      const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
      const queryToken = client.handshake.query?.token;
      
      let token: string | undefined;

      if (authHeader && typeof authHeader === 'string') {
        token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      } else if (queryToken && typeof queryToken === 'string') {
        token = queryToken;
      }

      if (!token) {
        this.logger.warn(`Connection rejected: Missing credentials on client ${client.id}`);
        client.disconnect();
        return;
      }

      // Development bypass for demo-token
      if (token === 'demo-token') {
        const roomName = 'landlord_e29d665b-efbe-40b3-bb66-df30bd5e8bf8';
        await client.join(roomName);
        this.logger.log(`Client ${client.id} authenticated as DEMO. Joined room: ${roomName}`);
        return;
      }

      // Verify token and extract claims
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'rental_saas_jwt_secret_key_change_me_in_prod',
      });

      const landlordId = payload.landlordId;
      if (!landlordId) {
        this.logger.warn(`Connection rejected: User ${payload.sub} has no landlordId context`);
        client.disconnect();
        return;
      }

      // Join client to the landlord-specific room for multi-tenancy isolation
      const roomName = `landlord_${landlordId}`;
      await client.join(roomName);
      this.logger.log(`Client ${client.id} authenticated. Joined room: ${roomName}`);
      
    } catch (error) {
      this.logger.error(`Connection rejected: Invalid authentication credentials on client ${client.id}`);
      client.disconnect();
    }
  }

  /**
   * Executed when a client disconnects
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Send notification to a specific landlord's dashboard room
   */
  sendToLandlord(landlordId: string, event: string, payload: any) {
    const roomName = `landlord_${landlordId}`;
    if (this.server) {
      this.server.to(roomName).emit(event, payload);
      this.logger.log(`Emitted event "${event}" to room "${roomName}"`);
    } else {
      this.logger.error('WebSocket server is not initialized yet.');
    }
  }
}
