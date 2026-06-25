const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Truncating all tables...');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "Landlord", "Room", "Contract", "Invoice", "RentRequest", "Incident", "Violation" CASCADE;`);
  console.log('Database truncated successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
