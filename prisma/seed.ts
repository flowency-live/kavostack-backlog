import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create first admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kavostack.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const adminName = process.env.ADMIN_NAME || 'KAVOStack Admin';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists: ${adminEmail}`);
  } else {
    const passwordHash = await hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        role: 'flowency_admin',
        passwordHash,
        emailVerified: true,
      },
    });

    console.log(`Created admin user: ${admin.email}`);
    console.log(`Password: ${adminPassword}`);
    console.log('');
    console.log('IMPORTANT: Change this password after first login!');
  }

  // Create a demo client (optional)
  const createDemo = process.env.CREATE_DEMO_CLIENT === 'true';

  if (createDemo) {
    const existingClient = await prisma.client.findUnique({
      where: { slug: 'demo' },
    });

    if (!existingClient) {
      const demoClient = await prisma.client.create({
        data: {
          name: 'Demo Client',
          slug: 'demo',
          description: 'A demo client for testing the backlog system',
        },
      });
      console.log(`Created demo client: ${demoClient.name}`);
    }
  }

  console.log('');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
