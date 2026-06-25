import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/saas_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const landlordId = 'e29d665b-efbe-40b3-bb66-df30bd5e8bf8';

  // Create an owner user if we don't have one
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'admin' },
    update: {
      password: hashedPassword
    },
    create: {
      email: 'admin',
      password: hashedPassword,
      name: 'Admin',
      role: 'LANDLORD',
    },

  });

  // Upsert the specific landlord
  const landlord = await prisma.landlord.upsert({
    where: { id: landlordId },
    update: {},
    create: {
      id: landlordId,
      name: 'Smart Boarding Demo Landlord',
      phone: '0123456789',
      address: '123 Smart Street, Tech City',
      ownerId: owner.id,
    },
  });

  // Create mock rooms
  const mockRooms = [
    {
      roomNumber: '101',
      price: 2500000,
      status: 'VACANT',
      description: 'Phòng rộng 25m2, có cửa sổ thoáng mát, nhà vệ sinh khép kín.',
      landlordId: landlord.id,
      imageUrls: [
        '/images/rooms/656430816_1617182629530479_8502833815304260238_n.jpg',
        '/images/rooms/656569282_1617182589530483_1781461734875750881_n.jpg'
      ]
    },
    {
      roomNumber: '102',
      price: 3000000,
      status: 'OCCUPIED',
      description: 'Phòng 30m2, đầy đủ nội thất cơ bản: giường, tủ, điều hòa.',
      landlordId: landlord.id,
      imageUrls: [
        '/images/rooms/656736806_1617182682863807_9186274800216742646_n.jpg',
        '/images/rooms/656846625_1617182739530468_3773791232134885063_n.jpg'
      ]
    },
    {
      roomNumber: '201',
      price: 2800000,
      status: 'VACANT',
      description: 'Phòng tầng 2, an ninh tốt, gần chỗ để xe chung.',
      landlordId: landlord.id,
      imageUrls: [
        '/images/rooms/656946529_1617182746197134_6752085107757227365_n.jpg',
        '/images/rooms/657726659_1617182832863792_8556804002044233718_n.jpg'
      ]
    },
    {
      roomNumber: '202',
      price: 2500000,
      status: 'MAINTENANCE',
      description: 'Đang sửa lại đường ống nước, dự kiến hoàn thành vào tuần sau.',
      landlordId: landlord.id,
      imageUrls: [
        '/images/rooms/657956025_1617182772863798_5692081040543147806_n.jpg'
      ]
    },
    {
      roomNumber: '301',
      price: 4000000,
      status: 'VACANT',
      description: 'Phòng VIP 40m2, nội thất cao cấp, có ban công riêng view đẹp.',
      landlordId: landlord.id,
      imageUrls: [
        '/images/rooms/658185877_1617182699530472_8317163589755499064_n.jpg',
        '/images/rooms/658479977_1617182662863809_242566351864885571_n.jpg'
      ]
    },
  ];

  console.log(`Seeding rooms for landlord ${landlordId}...`);

  for (const room of mockRooms) {
    // Check if room exists to avoid duplicates if run multiple times
    const existing = await prisma.room.findFirst({
      where: {
        roomNumber: room.roomNumber,
        landlordId: room.landlordId,
      }
    });

    if (!existing) {
      await prisma.room.create({
        data: {
          roomNumber: room.roomNumber,
          price: room.price,
          status: room.status as any,
          description: room.description,
          landlordId: room.landlordId,
          imageUrls: room.imageUrls,
        }
      });
      console.log(`Created room ${room.roomNumber}`);
    } else {
      await prisma.room.update({
        where: { id: existing.id },
        data: {
          imageUrls: room.imageUrls,
        }
      });
      console.log(`Updated room ${room.roomNumber} with images.`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
