import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as http from 'http';

const prisma = new PrismaClient();

function sign(payload: any, secret: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signature = crypto.createHmac('sha256', secret).update(header + '.' + payloadB64).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return header + '.' + payloadB64 + '.' + signature;
}

async function run() {
  const user = await prisma.user.findFirst({ where: { role: 'TENANT' } });
  if (!user) {
    console.log('No tenant found');
    return;
  }
  const contract = await prisma.contract.findFirst({ where: { tenantId: user.id } });
  if (!contract) {
    console.log('Tenant has no contract');
    return;
  }
  
  const token = sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'rental_saas_jwt_secret_key_change_me_in_prod');

  console.log('Using tenant:', user.email, 'Room:', contract.roomId);
  
  const incidentData = JSON.stringify({ title: 'ELECTRICITY', description: 'test incident', roomId: contract.roomId });
  
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/incidents',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      'Content-Length': Buffer.byteLength(incidentData)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      console.log('BODY:', body);
    });
  });
  
  req.write(incidentData);
  req.end();
}

run().finally(() => prisma.$disconnect());
