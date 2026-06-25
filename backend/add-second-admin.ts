/**
 * Script tạo tài khoản LANDLORD (admin) thứ 2 để test
 * Chạy: npx ts-node add-second-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/saas_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const email    = 'admin2';
  const password = 'password123';
  const name     = 'Admin 2 - Test Account';

  // Kiểm tra xem đã tồn tại chưa
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✅ Tài khoản "${email}" đã tồn tại (id: ${existing.id})`);
    console.log('Dùng thông tin đăng nhập: email=admin2 | password=password123');
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  // Tạo user LANDLORD
  const owner2 = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      role: 'LANDLORD',
    },
  });
  console.log(`✅ Đã tạo user: ${owner2.id}`);

  // Tạo Landlord profile cho admin 2
  const landlord2 = await prisma.landlord.create({
    data: {
      name: 'Nhà trọ Demo 2',
      phone: '0987654321',
      address: '456 Test Street, Demo City',
      ownerId: owner2.id,
    },
  });
  console.log(`✅ Đã tạo landlord profile: ${landlord2.id}`);

  // Liên kết user với landlord
  await prisma.user.update({
    where: { id: owner2.id },
    data: { landlordId: landlord2.id },
  });

  console.log('\n🎉 Tạo tài khoản thành công!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Email    : admin2`);
  console.log(`Password : password123`);
  console.log(`Role     : LANDLORD`);
  console.log(`LandlordId: ${landlord2.id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📌 Lưu ý: Mỗi LANDLORD có landlordId riêng biệt.');
  console.log('   Dữ liệu (phòng, hợp đồng, khách thuê) được scoped theo landlordId.');
  console.log('   2 admin đăng nhập đồng thời KHÔNG xung đột vì JWT là stateless.\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
