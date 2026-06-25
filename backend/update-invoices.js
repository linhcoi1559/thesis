require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const newDueDate = new Date();
  newDueDate.setDate(newDueDate.getDate() + 5);

  const result = await prisma.invoice.updateMany({
    where: { status: 'UNPAID' },
    data: {
      dueDate: newDueDate
    }
  });
  console.log(`Updated ${result.count} invoices to new due date:`, newDueDate);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
