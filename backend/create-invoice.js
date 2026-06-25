require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const contract = await prisma.contract.findFirst({
    where: { status: 'ACTIVE' }
  });
  if (contract) {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-TEST-${Date.now().toString().slice(-4)}`,
        contractId: contract.id,
        amount: contract.rentalPrice,
        dueDate: new Date('2026-06-10T00:00:00.000Z'),
        status: 'UNPAID',
        landlordId: contract.landlordId
      }
    });
    console.log('Created invoice:', invoice);
  } else {
    console.log('No active contract found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
