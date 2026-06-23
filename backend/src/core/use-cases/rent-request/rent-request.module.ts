import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { RentRequestService } from './rent-request.service';
import { RentRequestController } from '../../../presentation/controllers/rent-request.controller';
import { NotificationGateway } from '../../../presentation/gateways/notification.gateway';

@Module({
  imports: [
    // Import JwtModule to make JwtService available inside NotificationGateway for socket auth
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'rental_saas_jwt_secret_key_change_me_in_prod',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [RentRequestController],
  providers: [RentRequestService, NotificationGateway, PrismaService],
  exports: [RentRequestService, NotificationGateway],
})
export class RentRequestModule {}
