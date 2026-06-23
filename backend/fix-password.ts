import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/saas_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function fixPassword() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await prisma.user.updateMany({
    where: { email: 'landlord@demo.com' },
    data: { password: hashedPassword }
  });

  console.log('Password for landlord@demo.com has been fixed to password123');
}

fixPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
