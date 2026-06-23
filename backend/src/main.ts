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
  await prisma.$disconnect();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so the Next.js client can connect
  app.enableCors();

  // Enable global DTO validation
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Seed demo landlord data before listening
  await seedDemoData();

  await app.listen(3000);
  console.log('Backend server running on http://localhost:3000');
}
bootstrap();
