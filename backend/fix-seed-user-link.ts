import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/saas_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixLandlordLink() {
  const landlordId = 'e29d665b-efbe-40b3-bb66-df30bd5e8bf8';
  
  // Link the user to the landlord entity
  await prisma.user.updateMany({
    where: { email: 'landlord@demo.com' },
    data: { landlordId: landlordId }
  });

  console.log('Successfully linked landlord@demo.com to landlord entity.');
}

fixLandlordLink()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
