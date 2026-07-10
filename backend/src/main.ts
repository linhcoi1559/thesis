import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './infrastructure/database/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

async function seedDemoData() {
  const prisma = new PrismaService();
  const demoLandlordId = 'e29d665b-efbe-40b3-bb66-df30bd5e8bf8';
  const demoUserId = 'd1b28d08-d2e8-46dc-a05e-bb1234567890';

  const landlordExists = await prisma.landlord.findUnique({
    where: { id: demoLandlordId },
  });

  if (!landlordExists) {
    console.log('Seeding demo landlord data...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: demoUserId,
            email: 'landlord@test.com',
            password: hashedPassword,
            name: 'Chủ Trọ Demo',
            role: 'LANDLORD',
          },
        });

        await tx.landlord.create({
          data: {
            id: demoLandlordId,
            name: 'Nhà Trọ Demo',
            ownerId: demoUserId,
          },
        });

        await tx.user.update({
          where: { id: demoUserId },
          data: { landlordId: demoLandlordId },
        });
      });
      console.log('Demo landlord seeded successfully!');
    } catch (e) {
      console.error('Failed to seed demo landlord:', e);
    }
  }

  // Bắt đầu seed thêm Chủ Trọ B để test Multi-Tenancy
  const landlordBId = 'b29d665b-efbe-40b3-bb66-df30bd5e8bfb';
  const userBId = 'b1b28d08-d2e8-46dc-a05e-bb123456789b';

  const landlordBExists = await prisma.landlord.findUnique({
    where: { id: landlordBId },
  });

  if (!landlordBExists) {
    console.log('Seeding Chủ Trọ B data...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: userBId,
            email: 'landlordb@test.com',
            password: hashedPassword,
            name: 'Chủ Trọ B',
            role: 'LANDLORD',
          },
        });

        await tx.landlord.create({
          data: {
            id: landlordBId,
            name: 'Nhà Trọ B',
            ownerId: userBId,
          },
        });

        await tx.user.update({
          where: { id: userBId },
          data: { landlordId: landlordBId },
        });
      });
      console.log('Chủ Trọ B seeded successfully!');
    } catch (e) {
      console.error('Failed to seed Chủ Trọ B:', e);
    }
  }
  // Kết thúc seed Chủ Trọ B

  await prisma.$disconnect();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Restrict CORS to the frontend domain to prevent unauthorized API requests
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable global DTO validation with strict whitelisting to prevent Mass Assignment
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));

  // Seed demo landlord data before listening
  await seedDemoData();

  await app.listen(3000);
  console.log('Backend server running on http://localhost:3000');
}
bootstrap();
